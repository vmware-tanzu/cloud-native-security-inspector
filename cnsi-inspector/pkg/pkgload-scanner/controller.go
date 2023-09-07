package pkgload_scanner

import (
	"context"
	"encoding/json"
	"time"

	"github.com/go-co-op/gocron"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
	exporter_inputs "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-exporter/pkg/inputs"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/assets/workload"
	pkgclient "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client/v1alpha/api"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/risk-scanner/data"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/data/core"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/data/providers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/lib/log"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// Controller controls the inspection flow.
type Controller interface {
	// Run inspection.
	Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error
}

type PkgLoadController struct {
	kc         client.Client
	scheme     *runtime.Scheme
	ready      bool
	adapter    providers.Adapter
	pkgScanner pkgclient.PkgInfoClient

	collector workload.Collector
}

var (
	cfgDir = "./cfg/"
)

func (c *PkgLoadController) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	// read crontab from policy
	if policy.Spec.Schedule == "" {
		return errors.New("schedule is not set")
	}
	s := gocron.NewScheduler(time.Local)
	_, err := s.Cron(policy.Spec.Schedule).Do(c.scan, ctx, policy) // every minute
	if err != nil {
		return errors.Wrap(err, "schedule scan")
	}
	s.StartBlocking()
	return nil
}

func (c *PkgLoadController) scan(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.AddConfigPath(cfgDir)

	currentNodeName := getEnv("NODE_NAME", "")
	if currentNodeName == "" { // should not happen
		return errors.New("NODE_NAME env is not set")
	}

	// Skip work namespace.
	skips := []string{*policy.Spec.WorkNamespace}
	nsl, err := c.collector.CollectNamespaces(ctx, policy.Spec.Inspection.NamespaceSelector, skips)
	if err != nil {
		return errors.Wrap(err, "scan namespaces")
	}

	// Nothing to handle
	// Just in case.
	if len(nsl) == 0 {
		log.Info("no namespaces found")
		return nil
	}

	// lsof scan(container -> load files & load files -> container)
	var mContainerID2LsofFiles = make(map[string][]LsofInfo)
	lsofs, err := lsofScan()
	if err != nil {
		return errors.Wrap(err, "lsof scan")
	}
	for _, lsof := range lsofs {
		mContainerID2LsofFiles[lsof.ContainerID] = append(mContainerID2LsofFiles[lsof.ContainerID], lsof)
	}

	vulnLoaded := []VulnLoaded{}
	for _, ns := range nsl {
		// Get Pod and post the pod first
		var pods corev1.PodList
		// get only pods of current pod
		err = c.collector.CollectOtherResource(
			ctx, corev1.LocalObjectReference{Name: ns.Name}, policy.Spec.Inspection.WorkloadSelector, &pods)
		if err != nil {
			log.Error(err, "list pods")
		}

		// range pods
		for _, pod := range pods.Items {
			// filter pods of current node
			if pod.Spec.NodeName != currentNodeName {
				continue
			}
			// range containers
			for _, containerStatus := range pod.Status.ContainerStatuses {
				if !containerStatus.Ready {
					continue
				}
				// get image of container(container -> image)
				targetImage := containerStatus.Image
				aid := core.ParseArtifactIDFrom(targetImage, containerStatus.ImageID) // TODO: check
				imageItem := data.NewImageItem(targetImage, aid)
				// get report of image(image -> vuln list)
				imageHarborReport, err := imageItem.FetchHarborReport(c.adapter)
				if err != nil {
					log.Error(err, "fetch harbor report")
					continue
				}

				if len(imageHarborReport.Vulnerabilities) == 0 {
					log.Infof("no vulnerabilities found for %s", targetImage)
					continue
				}

				// scan pkg installed files of the image(pkg -> installed files, set using map)
				scanReport, err := c.pkgScanner.ScanImage(ctx, targetImage)
				if err != nil {
					log.Error(err, "scan image pkg info")
					continue
				}
				if !scanReport.Success {
					log.Error("scan image pkg info failed")
					continue
				}

				// filter innocent pkgs (vuln pkg -> installed files)
				mVulnPkg2Detail := make(map[string]VulnDetail)
				for _, vuln := range imageHarborReport.Vulnerabilities {
					pkg := getPkgFromScanReport(vuln.Package, scanReport)
					if pkg == nil {
						continue
					}
					mInstalledFiles := make(map[string]struct{})
					for _, file := range pkg.InstalledFiles {
						mInstalledFiles[file] = struct{}{}
					}
					mVulnPkg2Detail[vuln.Package] = VulnDetail{
						PkgName:           vuln.Package,
						Version:           vuln.Version,
						CVE:               vuln.ID,
						Severity:          vuln.Severity.String(),
						MapInstalledFiles: mInstalledFiles,
					}
				}
				// get container load files(container -> load files)
				relatedLsofs := mContainerID2LsofFiles[containerStatus.ContainerID]
				for _, lsof := range relatedLsofs {
					for _, filename := range lsof.Name {
						for vulnPkg, vulnPkgDetail := range mVulnPkg2Detail {
							// filter unused vuln pkg
							if _, ok := vulnPkgDetail.MapInstalledFiles[filename]; ok {
								// assemble & append report
								vulnLoaded = append(vulnLoaded, VulnLoaded{
									CVE:         vulnPkgDetail.CVE,
									Severity:    vulnPkgDetail.Severity,
									PkgName:     vulnPkg,
									Version:     vulnPkgDetail.Version,
									PID:         lsof.PID,
									User:        lsof.User,
									ContainerID: lsof.ContainerID,
									PodName:     pod.Name,
									Namespace:   pod.Namespace,
									NodeName:    pod.Spec.NodeName,
									ImageName:   containerStatus.Image,
								})
							}
						}
					}
				}
			}
		}
	}

	// write report as CR
	ExportImageReports(PkgLoadReport{VulnLoaded: vulnLoaded}, policy)

	return nil
}

type VulnDetail struct {
	PkgName           string              `json:"pkgName"`
	Version           string              `json:"version"`
	CVE               string              `json:"cve"`
	Severity          string              `json:"severity"`
	MapInstalledFiles map[string]struct{} `json:"mapInstalledFiles"`
}

type PkgLoadReport struct {
	VulnLoaded []VulnLoaded `json:"vulnLoaded"`
}

type VulnLoaded struct {
	// vuln info
	CVE      string `json:"cve"`
	Severity string `json:"severity"`
	// pkg info
	PkgName string `json:"pkgName"`
	Version string `json:"version"`
	// runtime
	PID  string `json:"pid"`
	User string `json:"user"`
	// k8s info
	ContainerID string `json:"containerID"`
	PodName     string `json:"podName"`
	Namespace   string `json:"namespace"`
	NodeName    string `json:"nodeName"`
	ImageName   string `json:"imageName"`
}

func getPkgFromScanReport(pkgName string, report *api.ScanResult) *api.Package {
	if report == nil {
		return nil
	}
	for _, pkg := range report.Pkg {
		if pkg.Name == pkgName {
			return &pkg
		}
	}
	return nil
}

// TODO: remove just for design
type LsofReport struct {
	ContainerID string
	LsofFiles   []string
}

// TODO: remove just for design
type ImageInstalledFailes struct {
	ImageName   string
	PkgFilesSet map[string]map[string]struct{}
	// {"pkgName": {"file1": struct{}, "file2": struct{}}, "pkgName2": {"file1": struct{}, "file2": struct{}}}
}

// NewController news a RiskController.
func NewController() *PkgLoadController {
	return &PkgLoadController{}
}

// WithK8sClient sets k8s client.
func (c *PkgLoadController) WithK8sClient(cli client.Client) *PkgLoadController {
	c.kc = cli
	return c
}

// WithScheme sets runtime scheme.
func (c *PkgLoadController) WithScheme(scheme *runtime.Scheme) *PkgLoadController {
	c.scheme = scheme
	return c
}

func (c *PkgLoadController) WithPkgScanner(client pkgclient.PkgInfoClient) *PkgLoadController {
	c.pkgScanner = client
	return c
}

// WithAdapter sets adapter.
func (s *PkgLoadController) WithAdapter(Adapter providers.Adapter) *PkgLoadController {
	s.adapter = Adapter
	return s
}

// CTRL returns RiskController interface.
func (c *PkgLoadController) CTRL() Controller {
	c.collector = workload.NewCollector().
		WithScheme(c.scheme).
		UseClient(c.kc).
		Complete()

	// Mark RiskController is ready.
	c.ready = true

	return c
}

func inArray(need string, arr []string) bool {
	for _, k := range arr {
		if k == need {
			return true
		}
	}

	return false
}

func ExportImageReports(report PkgLoadReport, pl *v1alpha1.InspectionPolicy) {
	if bytes, err := json.Marshal(report); err != nil {
		// Marshal failure should be fatal because it is unforgivable
		log.Fatal(err, "failed to marshal the insight struct")
	} else {
		exportStruct := &v1alpha1.ReportData{
			Source:       "insight_report",
			ExportConfig: pl.Spec.Inspector.ExportConfig,
			Payload:      string(bytes),
		}
		err = exporter_inputs.PostReport(exportStruct)
		if err != nil {
			// Post failure is error because network issues could happen
			log.Error(err, "failed to post the insight report", "Policy", pl.Name)
		}
	}
}
