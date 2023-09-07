package pkgload_scanner

import (
	"context"
	"encoding/json"
	"os"
	"regexp"
	"strconv"
	"sync"
	"time"

	"github.com/go-co-op/gocron"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
	exporter_inputs "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-exporter/pkg/inputs"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/assets/workload"
	pkgclient "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client/v1alpha/api"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/data"
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

	// mu for scanStatus
	mu         sync.Mutex
	scanStatus scanStatusType
}

type scanStatusType string

const (
	scanStatusEmpty   scanStatusType = ""
	scanStatusRunning scanStatusType = "running"
	scanStatusDone    scanStatusType = "done"
)

var (
	cfgDir = "./cfg/"
)

func (c *PkgLoadController) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	// read crontab from policy
	if policy.Spec.Schedule == "" {
		return errors.New("schedule is not set")
	}
	s := gocron.NewScheduler(time.Local)
	// TODO: get crontab from env
	_, err := s.Cron(policy.Spec.Schedule).Do(c.Scan, ctx, policy)
	if err != nil {
		return errors.Wrap(err, "schedule scan")
	}
	s.StartBlocking()
	return nil
}

func (c *PkgLoadController) Scan(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	c.mu.Lock()
	if c.scanStatus == scanStatusRunning {
		log.Info("scan is running, skip")
		c.mu.Unlock()
		return nil
	}
	c.scanStatus = scanStatusRunning
	c.mu.Unlock()
	defer func() {
		c.mu.Lock()
		c.scanStatus = scanStatusDone
		c.mu.Unlock()
	}()
	return c.scan(ctx, policy)
}

func (c *PkgLoadController) scan(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	log.Info("start scanning!!!")
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
		log.Debugf("%+v\n", lsof)
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

		if len(pods.Items) == 0 {
			log.Infof("no pods found in namespace %s", ns.Name)
			continue
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
				aid := core.ParseArtifactIDFrom(targetImage, containerStatus.ImageID) // FIXME: k8s imageId may be mismatched with target image, use the right digest sha for target image
				imageItem := data.NewImageItem(targetImage, aid)                      // FIXME: parse image id incorrectly
				// get report of image(image -> vuln list) TODO: check image existance
				imageHarborReport, err := imageItem.FetchHarborReport(c.adapter)
				if err != nil {
					log.Error(err, "fetch harbor report")
					continue
				}

				if len(imageHarborReport.Vulnerabilities) == 0 {
					log.Infof("no vulnerabilities found for %s", targetImage)
					continue
				}

				log.Infof("scanning artID:%s, imageID:%s", imageItem.ArtifactID.String(), containerStatus.ImageID)

				// scan pkg installed files of the image(pkg -> installed files, set using map)
				scanReport, err := c.pkgScanner.ScanImage(ctx, imageItem.ArtifactID.String()) // TODO: use image instead
				if err != nil {
					log.Error(err, "scan image pkg info")
					continue
				}
				if !scanReport.Success {
					log.Errorf("scan image pkg info failed,err:%s", scanReport.Msg)
					continue
				}

				// filter innocent pkgs (vuln pkg+cve pair -> installed files)
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
					mVulnPkg2Detail[getCVE2VulnPairKey(vuln.ID, pkg.Name)] = VulnDetail{
						PkgName:           vuln.Package,
						Version:           vuln.Version,
						CVE:               vuln.ID,
						Severity:          vuln.Severity.String(),
						MapInstalledFiles: mInstalledFiles,
					}
				}
				// get container load files(container -> load files)
				// regex containerID
				// containerd://e405daabf14caa702dc86c9f294397aa0c98c782059b5196ed1a5c677bc63d3f
				// docker://e405daabf14caa702dc86c9f294397aa0c98c782059b5196ed1a5c677bc63d3f
				regexpContainerID := regexp.MustCompile(`^.*://(.*)$`)
				containerID := regexpContainerID.ReplaceAllString(containerStatus.ContainerID, "$1")
				if containerID == "" {
					log.Errorf("invalid containerID: %s", containerStatus.ContainerID)
					continue
				}
				relatedLsofs, ok := mContainerID2LsofFiles[containerID]
				if !ok {
					log.Infof("no related lsof files found, containerID: %s", containerStatus.ContainerID)
				}
				for _, lsof4PID := range relatedLsofs {
					// ecah lsof record represents load files of a process
					mCVEPkgPairEncountered := make(map[string]struct{})
					for _, filename := range lsof4PID.Name {
						for _, vulnPkgDetail := range mVulnPkg2Detail {
							// filter unused vuln pkg
							if _, ok := vulnPkgDetail.MapInstalledFiles[filename]; ok {
								// check if the vuln pkg has been encountered
								if _, ok := mCVEPkgPairEncountered[getCVE2VulnPairKey(vulnPkgDetail.CVE, vulnPkgDetail.PkgName)]; ok {
									continue
								}
								mCVEPkgPairEncountered[getCVE2VulnPairKey(vulnPkgDetail.CVE, vulnPkgDetail.PkgName)] = struct{}{}
								// assemble & append report
								vulnLoaded = append(vulnLoaded, VulnLoaded{
									CVE:         vulnPkgDetail.CVE,
									Severity:    vulnPkgDetail.Severity,
									PkgName:     vulnPkgDetail.PkgName,
									Version:     vulnPkgDetail.Version,
									PID:         lsof4PID.PID,
									User:        lsof4PID.User,
									ContainerID: lsof4PID.ContainerID,
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

	if len(vulnLoaded) == 0 {
		log.Info("no loaded vulnerabilities found")
		return nil
	}

	pkgLoadReport := PkgLoadReport{
		VulnLoaded:      vulnLoaded,
		CreateTimestamp: strconv.FormatInt(time.Now().Unix(), 10),
		NodeName:        currentNodeName,
	}
	pkgLoadReport.DocID = pkgLoadReport.GenDocID()

	// export pkgload report
	ExportPkgloadReports(pkgLoadReport, policy)

	if _, ok := os.LookupEnv("DEBUG"); ok {
		log.Info("pkgload report", pkgLoadReport)
	}

	log.Info("scan complete!!!")
	return nil
}

func getCVE2VulnPairKey(cve, pkgName string) string {
	return cve + `-` + pkgName
}

type VulnDetail struct {
	PkgName           string              `json:"pkgName"`
	Version           string              `json:"version"`
	CVE               string              `json:"cve"`
	Severity          string              `json:"severity"`
	MapInstalledFiles map[string]struct{} `json:"mapInstalledFiles"`
}

type PkgLoadReport struct {
	VulnLoaded      []VulnLoaded `json:"vulnLoaded"` // vuln loaded
	NodeName        string       `json:"nodeName"`   // node name
	CreateTimestamp string       `json:"createTime"` // unix timestamp
	DocID           string       `json:"docID"`      // doc id, pkgload-{nodeName}-{createdAt}
}

func (p PkgLoadReport) GenDocID() string {
	return "pkgload-" + p.NodeName + "-" + p.CreateTimestamp
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
		// NOTE: no need to match version, for now
		if pkg.Name == pkgName {
			return &pkg
		}
	}
	return nil
}

// NewController news a PkgLoadController.
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

// CTRL returns PkgLoadController interface.
func (c *PkgLoadController) CTRL() Controller {
	c.collector = workload.NewCollector().
		WithScheme(c.scheme).
		UseClient(c.kc).
		Complete()

	// Mark PkgLoadController is ready.
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

func ExportPkgloadReports(report PkgLoadReport, pl *v1alpha1.InspectionPolicy) {
	if bytes, err := json.Marshal(&report); err != nil {
		// Marshal failure should be fatal because it is unforgivable
		log.Fatal(err, "failed to marshal the insight struct")
	} else {
		exportStruct := &v1alpha1.ReportData{
			Source:       "pkgload-scanner",
			ExportConfig: pl.Spec.Inspector.ExportConfig,
			Payload:      string(bytes),
		}
		err = exporter_inputs.PostReport(exportStruct)
		if err != nil {
			// Post failure is error because network issues could happen
			log.Error(err, "failed to post the pkgload report", "Policy", pl.Name)
		}
	}
}
