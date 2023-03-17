package outputs

import (
	"encoding/json"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/cspauth"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	governor "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/outputs/governor"
	openapi "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/outputs/governor/go-client"
	itypes "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspectors/workloadscanner/types"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"
)

type Governor struct {
	Payload string
	Config  v1alpha1.ExportConfig
}

func IntializeGovernor(payload string, config v1alpha1.ExportConfig) Governor {
	return Governor{
		Payload: payload,
		Config:  config,
	}
}

// Post posts event to GovernorAPI
func (g *Governor) Post() {
	var workloadReport itypes.WorkloadReport
	err := json.Unmarshal([]byte(g.Payload), &workloadReport)
	if err != nil {
		log.Errorf("failed to unmarshal workloadInfos, payload: %s, %v", g.Payload, err)
	}

	g.exportReport(&workloadReport)
}

func (g *Governor) exportReport(report *itypes.WorkloadReport) {
	// Create api client to governor api.
	config := openapi.NewConfiguration()
	config.Servers = openapi.ServerConfigurations{{
		URL: g.Config.Governor.URL,
	}}
	apiClient := openapi.NewAPIClient(config)

	cspClient, err := cspauth.NewCspHTTPClient()
	if err != nil {
		log.Errorf("Initializing CSP : %v", err)
	}
	provider := &cspauth.CspAuth{CspClient: cspClient}

	clientSet, err := kubernetes.NewForConfig(ctrl.GetConfigOrDie())
	if err != nil {
		log.Error(err, "Failed to get kubernetes clientSet, check if kube config is correctly configured!")
	}

	exporter := governor.GovernorExporter{
		Report:        report,
		ClusterID:     g.Config.Governor.ClusterID,
		ApiClient:     apiClient,
		CspProvider:   provider,
		KubeInterface: clientSet,
		CspSecretName: g.Config.Governor.CspSecretName,
	}

	if apiResponseErr := exporter.SendReport(); apiResponseErr != nil {
		log.Error("Err response from governor exporter", apiResponseErr)
	}
}
