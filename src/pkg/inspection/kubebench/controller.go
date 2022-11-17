package kubebench

import (
	"context"
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/go-logr/logr"
	"github.com/golang/glog"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	es "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/es"
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
	cfgDir  = "./cfg/"
	cfgFile string
)

func (c *controller) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.AddConfigPath(cfgDir)

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Config file not found; ignore error for now to prevent commands
			// which don't need the config file exiting.
			os.Exit(1)
		} else {
			// Config file was found but another error was produced
			colorPrint(check.FAIL, fmt.Sprintf("Failed to read config file: %v\n", err))
			os.Exit(1)
		}
	}

	var kubeVersion, benchmarkVersion string
	bv, err := getBenchmarkVersion(kubeVersion, benchmarkVersion, getPlatformInfo(), viper.GetViper())
	if err != nil {
		exitWithError(fmt.Errorf("unable to determine benchmark version: %v", err))
	}
	glog.V(1).Infof("Running checks for benchmark %v", bv)

	if isMaster() {
		glog.V(1).Info("== Running master checks ==")
		runChecks(check.MASTER, loadConfig(check.MASTER, bv), detecetedKubeVersion)

		// Control Plane is only valid for CIS 1.5 and later,
		// this a gatekeeper for previous versions
		valid, err := validTargets(bv, []string{string(check.CONTROLPLANE)}, viper.GetViper())
		if err != nil {
			exitWithError(fmt.Errorf("error validating targets: %v", err))
		}
		if valid {
			glog.V(1).Info("== Running control plane checks ==")
			runChecks(check.CONTROLPLANE, loadConfig(check.CONTROLPLANE, bv), detecetedKubeVersion)
		}
	} else {
		glog.V(1).Info("== Skipping master checks ==")
	}

	// Etcd is only valid for CIS 1.5 and later,
	// this a gatekeeper for previous versions.
	valid, err := validTargets(bv, []string{string(check.ETCD)}, viper.GetViper())
	if err != nil {
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid && isEtcd() {
		glog.V(1).Info("== Running etcd checks ==")
		runChecks(check.ETCD, loadConfig(check.ETCD, bv), detecetedKubeVersion)
	} else {
		glog.V(1).Info("== Skipping etcd checks ==")
	}

	glog.V(1).Info("== Running node checks ==")
	runChecks(check.NODE, loadConfig(check.NODE, bv), detecetedKubeVersion)

	// Policies is only valid for CIS 1.5 and later,
	// this a gatekeeper for previous versions.
	valid, err = validTargets(bv, []string{string(check.POLICIES)}, viper.GetViper())
	if err != nil {
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid {
		glog.V(1).Info("== Running policies checks ==")
		runChecks(check.POLICIES, loadConfig(check.POLICIES, bv), detecetedKubeVersion)
	} else {
		glog.V(1).Info("== Skipping policies checks ==")
	}

	// Managedservices is only valid for GKE 1.0 and later,
	// this a gatekeeper for previous versions.
	valid, err = validTargets(bv, []string{string(check.MANAGEDSERVICES)}, viper.GetViper())
	if err != nil {
		exitWithError(fmt.Errorf("error validating targets: %v", err))
	}
	if valid {
		glog.V(1).Info("== Running managed services checks ==")
		runChecks(check.MANAGEDSERVICES, loadConfig(check.MANAGEDSERVICES, bv), detecetedKubeVersion)
	} else {
		glog.V(1).Info("== Skipping managed services checks ==")
	}

	//writeOutput(controlsCollection)
	//println(controlsCollection)
	fmt.Println(controlsCollection)
	exportReportToES(controlsCollection, policy, c.logger)
	//os.Exit(exitCodeSelection(controlsCollection))
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
