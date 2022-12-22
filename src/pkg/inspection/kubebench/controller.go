package kubebench

import (
	"context"
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
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
	kc       client.Client
	scheme   *runtime.Scheme
	ready    bool
	hostname string
}

var (
	cfgDir  = "cmd/kubebench/cfg"
	cfgFile string
)

func (c *controller) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.AddConfigPath(cfgDir)

	log.Info("Scan using kube-bench")
	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Config file not found; ignore error for now to prevent commands
			// which don't need the config file exiting.
			log.Info("Cannot find the config file")
			os.Exit(1)
		} else {
			// Config file was found but another error was produced
			log.Errorf("Failed to read config file: %v\n", err)
			log.Info("Config file found, but some error occurred")
			os.Exit(1)
		}
	}

	var kubeVersion, benchmarkVersion string
	bv, err := getBenchmarkVersion(kubeVersion, benchmarkVersion, getPlatformInfo(), viper.GetViper())
	if err != nil {
		log.Error(err, "Unable to determine benchmark version")
		exitWithError(fmt.Errorf("unable to determine benchmark version: %v", err))
	}
	log.Info("Running checks for benchmark")

	if isMaster() {
		log.Info("== Running master checks ==")
		runChecks(check.MASTER, loadConfig(check.MASTER, bv), detecetedKubeVersion)

		// Control Plane is only valid for CIS 1.5 and later,
		// this a gatekeeper for previous versions
		valid, err := validTargets(bv, []string{string(check.CONTROLPLANE)}, viper.GetViper())
		if err != nil {
			log.Error(err, "error validating targets")
			exitWithError(fmt.Errorf("error validating targets: %v", err))
		}
		if valid {
			log.Info("== Running control plane checks ==")
			runChecks(check.CONTROLPLANE, loadConfig(check.CONTROLPLANE, bv), detecetedKubeVersion)
		}
	} else {
		log.Info("== Skipping master checks ==")
	}

	// Etcd is only valid for CIS 1.5 and later,
	// this a gatekeeper for previous versions.
	valid, err := validTargets(bv, []string{string(check.ETCD)}, viper.GetViper())
	if err != nil {
		log.Error(err, "error validating targets")
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid && isEtcd() {
		log.Info("== Running etcd checks ==")
		runChecks(check.ETCD, loadConfig(check.ETCD, bv), detecetedKubeVersion)
	} else {
		log.Info("== Skipping etcd checks ==")
	}

	log.Info("== Running node checks ==")
	runChecks(check.NODE, loadConfig(check.NODE, bv), detecetedKubeVersion)
	log.Debugf("== Results of node checks:  %v", len(controlsCollection))
	for _, control := range controlsCollection {
		b, _ := control.JSON()
		log.Debugf("b %v", string(b))
	}
	log.Info("------------------------------------------------------------------")

	// Policies is only valid for CIS 1.5 and later,
	// this a gatekeeper for previous versions.
	valid, err = validTargets(bv, []string{string(check.POLICIES)}, viper.GetViper())
	if err != nil {
		log.Error(err, "error validating targets")
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid {
		log.Info("== Running policies checks ==")
		runChecks(check.POLICIES, loadConfig(check.POLICIES, bv), detecetedKubeVersion)
	} else {
		log.Info("== Skipping policies checks ==")
	}

	// Managedservices is only valid for GKE 1.0 and later,
	// this a gatekeeper for previous versions.
	valid, err = validTargets(bv, []string{string(check.MANAGEDSERVICES)}, viper.GetViper())
	if err != nil {
		log.Error(err, "error validating targets")
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid {
		log.Info("== Running managed services checks ==")
		runChecks(check.MANAGEDSERVICES, loadConfig(check.MANAGEDSERVICES, bv), detecetedKubeVersion)
	} else {
		log.Info("== Skipping managed services checks ==")
	}

	if policy.Spec.Inspection.Assessment.ElasticSearchEnabled {
		if err := exportReportToES(controlsCollection, policy, c.hostname); err != nil {
			log.Error(err, "error exporting to Elasticsearch")
			return err
		}
	}
	if policy.Spec.Inspection.Assessment.OpenSearchEnabled {
		if err := exportReportToOpenSearch(controlsCollection, policy, c.hostname); err != nil {
			log.Error(err, "error exporting to Opensearch")
			return err
		}
	}
	return nil
}

func exportReportToES(controlsCollection []*check.Controls, policy *v1alpha1.InspectionPolicy, hostname string) error {
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
	log.Info("ES config: ", "addr", clientArgs.addr)
	log.Info("ES config: ", "clientArgs.username", clientArgs.username)
	client := es.NewClient(clientArgs.cert, clientArgs.addr, clientArgs.username, clientArgs.passwd)
	if client == nil {
		log.Info("ES client is nil")
	}

	if err := es.TestClient(); err != nil {
		log.Info("client test error")
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

func exportReportToOpenSearch(controlsCollection []*check.Controls, policy *v1alpha1.InspectionPolicy, hostname string) error {
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
	log.Info("OpenSearch config: ", "addr", clientArgs.addr)
	log.Info("OpenSearch config: ", "clientArgs.username", clientArgs.username)
	log.Info("controlsCollection length: ", "controlsCollection", len(controlsCollection))
	client := osearch.NewClient(clientArgs.cert, clientArgs.addr, clientArgs.username, clientArgs.passwd)
	if client == nil {
		log.Info("ES client is nil")
	}

	exporter := osearch.OpenSearchExporter{}
	err := exporter.WithHostname(hostname).NewExporter(client, "cis_report")
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

// WithHostname sets hostname.
func (c *controller) WithHostname(hostname string) *controller {
	c.hostname = hostname
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
