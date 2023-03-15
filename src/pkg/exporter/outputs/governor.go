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

// GovernorPost posts event to GovernorAPI
func (c *Client) GovernorPost(payloadStr string) {
	var workloadReport itypes.WorkloadReport
	err := json.Unmarshal([]byte(payloadStr), &workloadReport)
	if err != nil {
		log.Errorf("failed to unmarshal workloadInfos, payload: %s, %v", payloadStr, err)
	}

	exportReportToGovernor(&workloadReport, &c.Config.Governor)
}

func exportReportToGovernor(report *itypes.WorkloadReport, governorConfig *v1alpha1.Governor) error {
	// Create api client to governor api.
	config := openapi.NewConfiguration()
	config.Servers = openapi.ServerConfigurations{{
		URL: governorConfig.URL,
	}}
	apiClient := openapi.NewAPIClient(config)

	cspClient, err := cspauth.NewCspHTTPClient()
	if err != nil {
		log.Errorf("Initializing CSP : %v", err)
		return err
	}
	provider := &cspauth.CspAuth{CspClient: cspClient}

	clientSet, err := kubernetes.NewForConfig(ctrl.GetConfigOrDie())
	if err != nil {
		log.Error(err, "Failed to get kubernetes clientSet, check if kube config is correctly configured!")
		return err
	}

	exporter := governor.GovernorExporter{
		Report:        report,
		ClusterID:     governorConfig.ClusterID,
		ApiClient:     apiClient,
		CspProvider:   provider,
		KubeInterface: clientSet,
		CspSecretName: governorConfig.CspSecretName,
	}

	if apiResponseErr := exporter.SendReportToGovernor(); apiResponseErr != nil {
		log.Error("Err response from governor exporter", apiResponseErr)
		return apiResponseErr
	}

	return nil
}
