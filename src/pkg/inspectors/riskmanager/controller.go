package riskmanager

import (
	"context"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/assets/workload"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspectors/riskmanager/data"
	v1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"time"
)

// Controller controls the inspection flow.
type Controller interface {
	// Run inspection.
	Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error
}

type RiskController struct {
	kc     client.Client
	scheme *runtime.Scheme
	ready  bool

	collector workload.Collector
}

var (
	cfgDir = "./cfg/"
)

func (c *RiskController) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.AddConfigPath(cfgDir)
	// check server is running
	c.checkServerRunning()

	conf := ReadEnvConfig()

	if conf.StandAlone {
		server := NewServer()
		go func() {
			server.Run(conf.Server)
		}()
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

	var allResources []*data.ResourceItem
	var nodes []string
	for _, ns := range nsl {
		// Get Pod and post the pod first
		var pods corev1.PodList
		err = c.collector.CollectOtherResource(ctx, corev1.LocalObjectReference{Name: ns.Name}, policy.Spec.Inspection.WorkloadSelector, &pods)
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
			log.Error(err, "list pods")
		}
		// Get Deployment
		var deploys v1.DeploymentList
		err = c.collector.CollectOtherResource(ctx, corev1.LocalObjectReference{Name: ns.Name}, policy.Spec.Inspection.WorkloadSelector, &deploys)
		if err == nil {
			for _, deploy := range deploys.Items {
				resource := data.NewResourceItem("Deployment")
				resource.SetDeployment(deploy)
				allResources = append(allResources, resource)
			}
		} else {
			log.Error(err, "list deployments")
		}
		// Get Service
		var services corev1.ServiceList
		err = c.collector.CollectOtherResource(ctx, corev1.LocalObjectReference{Name: ns.Name}, policy.Spec.Inspection.WorkloadSelector, &services)
		if err == nil {
			for _, service := range services.Items {
				resource := data.NewResourceItem("Service")
				resource.SetService(service)
				allResources = append(allResources, resource)
			}
		} else {
			log.Error(err, "list services")
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
				log.Error(err, "get node")
			}
		}
	}

	httpClient := NewClient(conf)

	for _, v := range allResources {
		log.Infof("resource name: %s, type: %s \n", v.ObjectMeta.Name, v.Type)
		if v.IsPod() {
			log.Infof("pod name: %s, namespace: %s \n", v.Pod.GetName(), v.Pod.GetNamespace())
		}
		err = httpClient.
			PostResource(v)
		if err != nil {
			log.Error(err, "cannot post resource")
		}
	}

	option := AnalyzeOption{}

	if err = httpClient.PostAnalyze(option); err == nil {
		for {
			if ok, err := httpClient.IsAnalyzeRunning(); err != nil {
				log.Error(err, "failed to fetch status")
				time.Sleep(1 * time.Second)
			} else if ok {
				log.Info("the analyze is running")
				time.Sleep(30 * time.Second)
			} else if !ok {
				_ = httpClient.SendExitInstruction()
				log.Info("the analyze is done")
				break
			}
		}
	}

	return nil
}

// NewController news a RiskController.
func NewController() *RiskController {
	return &RiskController{}
}

// WithK8sClient sets k8s client.
func (c *RiskController) WithK8sClient(cli client.Client) *RiskController {
	c.kc = cli
	return c
}

// WithScheme sets runtime scheme.
func (c *RiskController) WithScheme(scheme *runtime.Scheme) *RiskController {
	c.scheme = scheme
	return c
}

// CTRL returns RiskController interface.
func (c *RiskController) CTRL() Controller {
	c.collector = workload.NewCollector().
		WithScheme(c.scheme).
		UseClient(c.kc).
		Complete()

	// Mark RiskController is ready.
	c.ready = true

	return c
}

func (c *RiskController) checkServerRunning() {
	conf := ReadEnvConfig()
	httpClient := NewClient(conf)
	for {
		if _, err := httpClient.IsAnalyzeRunning(); err != nil {
			log.Info("Server Starting, waiting ...")
			time.Sleep(3 * time.Second)
		} else {
			break
		}
	}
}

func inArray(need string, arr []string) bool {
	for _, k := range arr {
		if k == need {
			return true
		}
	}

	return false
}
