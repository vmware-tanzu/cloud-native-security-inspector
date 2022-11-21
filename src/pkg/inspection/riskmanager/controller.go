package riskmanager

import (
	"context"
	"github.com/go-logr/logr"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	osearch "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/opensearch"
	"k8s.io/apimachinery/pkg/runtime"
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
}

var (
	cfgDir  = "./cfg/"
	cfgFile string
)

func (c *controller) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.AddConfigPath(cfgDir)

	client := osearch.NewClient([]byte{},
		policy.Spec.Inspection.Assessment.OpenSearchAddr,
		policy.Spec.Inspection.Assessment.OpenSearchUser,
		policy.Spec.Inspection.Assessment.OpenSearchPasswd)
	if client == nil {
		c.logger.Info("OpenSearch client is nil", nil, nil)
	}

	conf := ReadEnvConfig()

	if conf.StandAlone {
		exporterDetail := osearch.OpenSearchExporter{Client: client, Logger: c.logger}
		err := exporterDetail.NewExporter(client, "assessment_report")
		if err != nil {
			//Error Handling
			return err
		}

		exporterAccessReport := osearch.OpenSearchExporter{Client: client, Logger: c.logger}
		err = exporterAccessReport.NewExporter(client, conf.DetailIndex)
		if err != nil {
			//Error handling
			return err
		}

		server := NewServer(&exporterDetail, &exporterAccessReport)
		go func() {
			server.Run(conf.Server)
		}()
	}

	//TODO
	// @jinpeng get all resources

	httpClient := NewClient(conf, c.logger)
	var allResources []ResourceItem

	for _, v := range allResources {
		err := httpClient.PostResource(v)
		if err != nil {
			c.logger.Error(err, "cannot post resource")
		}
	}

	option := AnalyzeOption{DumpAssessReport: true, DumpDetails: true}

	if err := httpClient.PostAnalyze(option); err == nil {
		for {
			if ok, err := httpClient.IsAnalyzeRunning(); err != nil {
				c.logger.Error(err, "failed to fetch status")
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
