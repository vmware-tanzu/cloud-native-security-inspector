package consumers

import (
	api "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	openapi "gitlab.eng.vmware.com/vac/catalog-governor/api-specs/catalog-governor-service-rest/go-client"
	v1 "k8s.io/api/core/v1"
	"os"
	"testing"
)

var (
	mockClient   *openapi.APIClient
	clusterID    = "testingId"
	apiToken     = "apiToken"
	namespace    = "testingNamespace"
	name         = "name"
	image        = "image"
	imageID      = "imageId"
	replicaCount = 2
)

const (
	testHost   = "clusterapi.swagger.io:80"
	testScheme = "http"
)

func TestMain(m *testing.M) {
	cfg := openapi.NewConfiguration()
	cfg.AddDefaultHeader("testheader", "testvalue")
	cfg.Host = testHost
	cfg.Scheme = testScheme
	mockClient = openapi.NewAPIClient(cfg)
	retCode := m.Run()
	os.Exit(retCode)
}

func TestSendReportToGovernorSuccess(t *testing.T) {
	actualApi := mockClient.ClustersApi
	mockApi := NewMockClustersApi()
	mockClient.ClustersApi = mockApi

	g := GovernorExporter{
		Report: &api.AssessmentReport{
			Spec: api.AssessmentReportSpec{NamespaceAssessments: []*api.NamespaceAssessment{{Namespace: v1.LocalObjectReference{
				Name: namespace,
			},
				WorkloadAssessments: []*api.WorkloadAssessment{{Workload: api.Workload{Replicas: int32(replicaCount),
					Pods: []*api.Pod{{Containers: []*api.Container{{
						Name:    name,
						Image:   image,
						ImageID: imageID,
					}}}}}}}}}}},
		ClusterID: clusterID,
		ApiToken:  apiToken,
		ApiClient: mockClient,
	}

	errFromSendReportToGovernor := g.SendReportToGovernor()
	if errFromSendReportToGovernor != nil {
		t.Fatalf("Error while updating telemetry data of workloads in cluster: %v", errFromSendReportToGovernor)
	}
	mockClient.ClustersApi = actualApi

}
