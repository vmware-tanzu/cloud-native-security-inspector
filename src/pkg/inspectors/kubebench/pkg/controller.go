package pkg

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/inputs"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspectors/kubebench/types"
	"k8s.io/apimachinery/pkg/runtime"
	"os"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"time"
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
	cfgDir  = "cfg"
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
	for _, checkControlPtr := range controlsCollection {
		reportData := c.constructCISExportStruct(policy, checkControlPtr)
		if reportData != nil {
			inputs.PostReport(reportData)
		}
	}
	return nil
}

func (c *controller) constructCISExportStruct(pl *v1alpha1.InspectionPolicy, checkControls *check.Controls) *v1alpha1.ReportData {
	cisReport := types.CISReport{
		Controls:        *checkControls,
		CreateTimestamp: time.Now().Format(time.RFC3339),
		NodeName:        c.hostname,
	}
	bytes, err := json.Marshal(cisReport)
	if err != nil {
		log.Error(err, "failed to marshal the CIS report")
		return nil
	}
	reportData := &v1alpha1.ReportData{
		Source:       "kubebench",
		ExportConfig: pl.Spec.Inspector.ExportConfig,
		Payload:      string(bytes),
	}
	return reportData
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
