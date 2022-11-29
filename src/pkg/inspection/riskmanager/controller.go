package riskmanager

import (
	"context"
	"github.com/go-logr/logr"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	osearch "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/opensearch"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/inspection"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/inspection/data"
	v1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"log"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"time"
)

// Controller controls the inspection flow.
type Controller interface {
	// Run inspection.
	Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error
}

type controller struct {
	kc     client.Client
	logger logr.Logger
	scheme *runtime.Scheme
	ready  bool

	scanner inspection.Scanner
}

var (
	cfgDir  = "./cfg/"
	cfgFile string
)

func (c *controller) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.AddConfigPath(cfgDir)

	osClient := osearch.NewClient([]byte{},
		policy.Spec.Inspection.Assessment.OpenSearchAddr,
		policy.Spec.Inspection.Assessment.OpenSearchUser,
		policy.Spec.Inspection.Assessment.OpenSearchPasswd)
	if osClient == nil {
		c.logger.Info("OpenSearch osClient is nil", nil, nil)
	}

	conf := ReadEnvConfig()

	if conf.StandAlone {
		exporterDetail := osearch.OpenSearchExporter{Client: osClient, Logger: c.logger}
		err := exporterDetail.NewExporter(osClient, conf.DetailIndex)
		if err != nil {
			//Error Handling
			return err
		}

		exporterAccessReport := osearch.OpenSearchExporter{Client: osClient, Logger: c.logger}
		err = exporterAccessReport.NewExporter(osClient, "assessment_report")
		if err != nil {
			//Error handling
			return err
		}

		server := NewServer(&exporterDetail, &exporterAccessReport)
		go func() {
			server.Run(conf.Server)
		}()
	}

	// Skip work namespace.
	skips := []string{*policy.Spec.WorkNamespace}
	nsl, err := c.scanner.ScanNamespaces(ctx, policy.Spec.Inspection.NamespaceSelector, skips)
	if err != nil {
		return errors.Wrap(err, "scan namespaces")
	}

	// Nothing to handle
	// Just in case.
	if len(nsl) == 0 {
		c.logger.V(1).Info("no namespaces found")
		return nil
	}

	var allResources []*data.ResourceItem
	var nodes []string
	for _, ns := range nsl {
		// Get Pod and post the pod first
		var pods corev1.PodList
		err = c.scanner.ScanOtherResource(ctx, corev1.LocalObjectReference{Name: ns.Name}, policy.Spec.Inspection.WorkloadSelector, &pods)
		if err == nil {
			for _, pod := range pods.Items {
				resource := data.NewResourceItem("Pod")
				resource.SetPod(pod)
				allResources = append(allResources, resource)
				nodeName := pod.Spec.NodeName
				if nodeName != "" && !inArray(nodeName, nodes) {
					nodes = append(nodes, nodeName)
				}
			}
		} else {
			c.logger.Error(err, "list pods")
		}
		// Get Deployment
		var deploys v1.DeploymentList
		err = c.scanner.ScanOtherResource(ctx, corev1.LocalObjectReference{Name: ns.Name}, policy.Spec.Inspection.WorkloadSelector, &deploys)
		if err == nil {
			for _, deploy := range deploys.Items {
				resource := data.NewResourceItem("Deployment")
				resource.SetDeployment(&deploy)
				allResources = append(allResources, resource)
			}
		} else {
			c.logger.Error(err, "list deployments")
		}
		// Get Service
		var services corev1.ServiceList
		err = c.scanner.ScanOtherResource(ctx, corev1.LocalObjectReference{Name: ns.Name}, policy.Spec.Inspection.WorkloadSelector, &services)
		if err == nil {
			for _, service := range services.Items {
				resource := data.NewResourceItem("Service")
				resource.SetService(&service)
				allResources = append(allResources, resource)
			}
		} else {
			c.logger.Error(err, "list services")
		}

	}
	// Get Node
	if len(nodes) > 0 {
		for _, i := range nodes {
			var node corev1.Node
			err = c.kc.Get(ctx, client.ObjectKey{Name: i}, &node)
			if err == nil {
				resource := data.NewResourceItem("Node")
				resource.SetNode(&node)
				allResources = append(allResources, resource)
			} else {
				c.logger.Error(err, "get node")
			}
		}
	}

	httpClient := NewClient(conf, c.logger)

	for _, v := range allResources {
		log.Default().Printf("resource name: %s, type: %s \n", v.ObjectMeta.Name, v.Type)
		if v.IsPod() {
			log.Default().Printf("pod name: %s, namespace: %s", v.Pod.GetName(), v.Pod.GetNamespace())
		}
		err = httpClient.
			PostResource(v)
		if err != nil {
			c.logger.Error(err, "cannot post resource")
		}
	}

	option := AnalyzeOption{DumpDetails: true}

	if err = httpClient.PostAnalyze(option); err == nil {
		for {
			if ok, err := httpClient.IsAnalyzeRunning(); err != nil {
				c.logger.Error(err, "failed to fetch status")
				time.Sleep(1 * time.Second)
			} else if ok {
				c.logger.Info("the analyze is running")
				time.Sleep(30 * time.Second)
			} else {
				c.logger.Info("the analyze is done")
				break
			}
		}
	}

	return nil
}

//func exportReportToOpenSearch(report RiskCollection, policy *v1alpha1.InspectionPolicy, logger logr.Logger) error {
//	client := osearch.NewClient([]byte{},
//		policy.Spec.Inspection.Assessment.OpenSearchAddr,
//		policy.Spec.Inspection.Assessment.OpenSearchUser,
//		policy.Spec.Inspection.Assessment.OpenSearchPasswd)
//	if client == nil {
//		logger.Info("OpenSearch client is nil", nil, nil)
//	}
//	exporter := osearch.OpenSearchExporter{Client: client, Logger: logger}
//	err := exporter.NewExporter(client, "assessment_report")
//	if err != nil {
//		return err
//	}
//	if err = exporter.SaveRiskReport(report); err != nil {
//		return err
//	}
//	return nil
//}

// NewController news a controller.
func NewController() *controller {
	return &controller{}
}

// WithK8sClient sets k8s client.
func (c *controller) WithK8sClient(cli client.Client) *controller {
	c.kc = cli
	return c
}

// WithLogger sets logger.
func (c *controller) WithLogger(logger logr.Logger) *controller {
	c.logger = logger
	return c
}

// WithScheme sets runtime scheme.
func (c *controller) WithScheme(scheme *runtime.Scheme) *controller {
	c.scheme = scheme
	return c
}

// CTRL returns controller interface.
func (c *controller) CTRL() Controller {
	c.scanner = inspection.NewScanner().
		WithScheme(c.scheme).
		UseClient(c.kc).
		SetLogger(c.logger).
		Complete()

	// Mark controller is ready.
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
