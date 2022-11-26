package kubebench

import (
	"context"
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/go-logr/logr"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	es "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/es"
	osearch "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/opensearch"
	"k8s.io/apimachinery/pkg/runtime"
	"os"
	"sigs.k8s.io/controller-runtime/pkg/client"
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
	cfgDir  = "cmd/kubebench/cfg"
	cfgFile string
)

func (c *controller) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.AddConfigPath(cfgDir)

	c.logger.Info("Scan using kube-bench")
	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Config file not found; ignore error for now to prevent commands
			// which don't need the config file exiting.
			c.logger.Info("Cannot find the config file")
			os.Exit(1)
		} else {
			// Config file was found but another error was produced
			colorPrint(check.FAIL, fmt.Sprintf("Failed to read config file: %v\n", err))
			c.logger.Info("Config file found, but some error occurred")
			os.Exit(1)
		}
	}

	var kubeVersion, benchmarkVersion string
	bv, err := getBenchmarkVersion(kubeVersion, benchmarkVersion, getPlatformInfo(), viper.GetViper())
	if err != nil {
		c.logger.Error(err, "Unable to determine benchmark version")
		exitWithError(fmt.Errorf("unable to determine benchmark version: %v", err))
	}
	c.logger.Info("Running checks for benchmark")

	if isMaster() {
		c.logger.Info("== Running master checks ==")
		runChecks(check.MASTER, loadConfig(check.MASTER, bv), detecetedKubeVersion)

		// Control Plane is only valid for CIS 1.5 and later,
		// this a gatekeeper for previous versions
		valid, err := validTargets(bv, []string{string(check.CONTROLPLANE)}, viper.GetViper())
		if err != nil {
			c.logger.Error(err, "error validating targets")
			exitWithError(fmt.Errorf("error validating targets: %v", err))
		}
		if valid {
			c.logger.Info("== Running control plane checks ==")
			runChecks(check.CONTROLPLANE, loadConfig(check.CONTROLPLANE, bv), detecetedKubeVersion)
		}
	} else {
		c.logger.Info("== Skipping master checks ==")
	}

	// Etcd is only valid for CIS 1.5 and later,
	// this a gatekeeper for previous versions.
	valid, err := validTargets(bv, []string{string(check.ETCD)}, viper.GetViper())
	if err != nil {
		c.logger.Error(err, "error validating targets")
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid && isEtcd() {
		c.logger.Info("== Running etcd checks ==")
		runChecks(check.ETCD, loadConfig(check.ETCD, bv), detecetedKubeVersion)
	} else {
		c.logger.Info("== Skipping etcd checks ==")
	}

	c.logger.Info("== Running node checks ==")
	runChecks(check.NODE, loadConfig(check.NODE, bv), detecetedKubeVersion)

	// Policies is only valid for CIS 1.5 and later,
	// this a gatekeeper for previous versions.
	valid, err = validTargets(bv, []string{string(check.POLICIES)}, viper.GetViper())
	if err != nil {
		c.logger.Error(err, "error validating targets")
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid {
		c.logger.Info("== Running policies checks ==")
		runChecks(check.POLICIES, loadConfig(check.POLICIES, bv), detecetedKubeVersion)
	} else {
		c.logger.Info("== Skipping policies checks ==")
	}

	// Managedservices is only valid for GKE 1.0 and later,
	// this a gatekeeper for previous versions.
	valid, err = validTargets(bv, []string{string(check.MANAGEDSERVICES)}, viper.GetViper())
	if err != nil {
		c.logger.Error(err, "error validating targets")
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid {
		c.logger.Info("== Running managed services checks ==")
		runChecks(check.MANAGEDSERVICES, loadConfig(check.MANAGEDSERVICES, bv), detecetedKubeVersion)
	} else {
		c.logger.Info("== Skipping managed services checks ==")
	}

	if policy.Spec.Inspection.Assessment.ElasticSearchEnabled {
		if err := exportReportToES(controlsCollection, policy, c.logger); err != nil {
			c.logger.Error(err, "error exporting to Elasticsearch")
			return err
		}
	}
	if policy.Spec.Inspection.Assessment.OpenSearchEnabled {
		if err := exportReportToOpenSearch(controlsCollection, policy, c.logger); err != nil {
			c.logger.Error(err, "error exporting to Opensearch")
			return err
		}
	}
	return nil
}

func exportReportToES(controlsCollection []*check.Controls, policy *v1alpha1.InspectionPolicy, logger logr.Logger) error {
	cert := []byte(policy.Spec.Inspection.Assessment.ElasticSearchCert)

	type args struct {
		cert     []byte
		addr     string
		username string
		passwd   string
	}
	// password: kubectl get secret instanceName-es-elastic-user -o go-template='{{.data.elastic | base64decode}}'
	clientArgs := args{
		cert,
		policy.Spec.Inspection.Assessment.ElasticSearchAddr,
		policy.Spec.Inspection.Assessment.ElasticSearchUser,
		policy.Spec.Inspection.Assessment.ElasticSearchPasswd,
	}
	logger.Info("ES config: ", "addr", clientArgs.addr)
	logger.Info("ES config: ", "clientArgs.username", clientArgs.username)
	client := es.NewClient(clientArgs.cert, clientArgs.addr, clientArgs.username, clientArgs.passwd)
	if client == nil {
		logger.Info("ES client is nil", nil, nil)
	}

	if err := es.TestClient(); err != nil {
		logger.Info("client test error", nil, nil)
		return err
	}
	exporter := es.ElasticSearchExporter{}
	err := exporter.NewExporter(client, "cis_report")
	if err != nil {
		return err
	}

	if err := exporter.SaveCIS(controlsCollection); err != nil {
		return err
	}
	return nil
}

func exportReportToOpenSearch(controlsCollection []*check.Controls, policy *v1alpha1.InspectionPolicy, logger logr.Logger) error {
	cert := []byte(policy.Spec.Inspection.Assessment.ElasticSearchCert)

	type args struct {
		cert     []byte
		addr     string
		username string
		passwd   string
	}
	// password: kubectl get secret instanceName-es-elastic-user -o go-template='{{.data.elastic | base64decode}}'
	clientArgs := args{
		cert,
		policy.Spec.Inspection.Assessment.OpenSearchAddr,
		policy.Spec.Inspection.Assessment.OpenSearchUser,
		policy.Spec.Inspection.Assessment.OpenSearchPasswd,
	}
	logger.Info("OpenSearch config: ", "addr", clientArgs.addr)
	logger.Info("OpenSearch config: ", "clientArgs.username", clientArgs.username)
	client := osearch.NewClient(clientArgs.cert, clientArgs.addr, clientArgs.username, clientArgs.passwd)
	if client == nil {
		logger.Info("ES client is nil", nil, nil)
	}

	exporter := osearch.OpenSearchExporter{}
	err := exporter.NewExporter(client, "cis_report")
	if err != nil {
		return err
	}

	if err := exporter.SaveCIS(controlsCollection); err != nil {
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
