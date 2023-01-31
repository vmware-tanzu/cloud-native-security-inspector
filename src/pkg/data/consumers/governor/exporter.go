package consumers

import (
	"context"
	"errors"
	api "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	openapi "gitlab.eng.vmware.com/vac/catalog-governor/api-specs/catalog-governor-service-rest/go-client"
	"net/http"
)

type GovernorExporter struct {
	Report    *api.AssessmentReport
	ClusterID string
	ApiURL    string
	ApiToken  string
}

// SendReportToGovernor is used to send report to governor url http end point.
func (g GovernorExporter) SendReportToGovernor() error {
	// Get api request model from assessment report.
	kubernetesCluster := getAPIRequest(*g.Report)

	// Create api client to governor api.
	apiClient := openapi.NewAPIClient(openapi.NewConfiguration())
	apiSaveClusterRequest := apiClient.ClustersApi.UpdateTelemetry(context.Background(), g.ClusterID)

	// Call api cluster to send telemetry data and get response.
	response, err := apiSaveClusterRequest.KubernetesTelemetryRequest(kubernetesCluster).Execute()
	if err != nil {
		return err
	}
	if response.StatusCode != http.StatusOK {
		return errors.New(response.Status)
	}

	return nil
}

// getAPIRequest is used to map assessment report to client model.
func getAPIRequest(doc api.AssessmentReport) openapi.KubernetesTelemetryRequest {
	kubernetesCluster := openapi.NewKubernetesTelemetryRequestWithDefaults()
	for _, nsa := range doc.Spec.NamespaceAssessments {
		for _, workloadAssessment := range nsa.WorkloadAssessments {
			kubernetesWorkloads := openapi.NewKubernetesWorkloadWithDefaults()
			kubernetesWorkloads.Name = workloadAssessment.Workload.Name
			kubernetesWorkloads.Kind = workloadAssessment.Workload.Kind
			kubernetesWorkloads.Namespace = nsa.Namespace.Name
			kubernetesWorkloads.Replicas = *workloadAssessment.Workload.Replicas.Spec.Replicas
			for _, pod := range workloadAssessment.Workload.Pods {
				containerData := openapi.NewContainerWithDefaults()
				for _, container := range pod.Containers {
					containerData.Name = container.Name
					containerData.ImageId = container.ImageID
					containerData.Image = container.Image
					kubernetesWorkloads.Containers = append(kubernetesWorkloads.Containers, *containerData)
				}
			}
			kubernetesCluster.Workloads = append(kubernetesCluster.Workloads, *kubernetesWorkloads)
		}
	}
	return *kubernetesCluster
}
