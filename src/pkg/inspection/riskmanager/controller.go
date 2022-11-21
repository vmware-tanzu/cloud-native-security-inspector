package kubebench

import (
	"context"
	"github.com/go-logr/logr"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	osearch "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/opensearch"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// Controller controls the inspection flow.
type Controller interface {
	// Run inspection.
	Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error
}

type HostRiskItem struct {

}

type VulnerabilityRiskItem struct {

}

type ExposureRiskItem struct {

}

type ComplianceRiskItem struct {

}


type RiskCollection struct {
	Hosts 	[]HostRiskItem
	Exposes []ExposureRiskItem
	Comps  	[]ComplianceRiskItem
	Vulns 	[]VulnerabilityRiskItem
}


type controller struct {
	kc     client.Client
	logger logr.Logger
	scheme *runtime.Scheme
	ready  bool
}

var (
	cfgDir  = "./cfg/"
	cfgFile string
)

func (c *controller) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.AddConfigPath(cfgDir)

	r := &RiskCollection{

	}

	exportReportToOpenSearch(r, policy, c.logger)
	//os.Exit(exitCodeSelection(controlsCollection))
	return nil
}

func generateReport(report *RiskCollection, policy *v1alpha1.InspectionPolicy) (r v1alpha1.AssessmentReport) {
	//TODO
	return
}

func exportReportToOpenSearch(report *RiskCollection, policy *v1alpha1.InspectionPolicy, logger logr.Logger) error {
	client := osearch.NewClient([]byte{},
		policy.Spec.Inspection.Assessment.OpenSearchAddr,
		policy.Spec.Inspection.Assessment.OpenSearchUser,
		policy.Spec.Inspection.Assessment.OpenSearchPasswd)
	if client == nil {
		logger.Info("OpenSearch client is nil", nil, nil)
	}
	exporter := osearch.OpenSearchExporter{Client: client, Logger: logger}
	err := exporter.NewExporter(client, "assessment_report")
	if err != nil {
		return err
	}
	if err := exporter.SaveRiskReport(report); err != nil {
		return err
	}
	return nil
}


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
	// Mark controller is ready.
	c.ready = true

	return c
}
