package consumers

import (
	"context"
	openapi "gitlab.eng.vmware.com/vac/catalog-governor/api-specs/catalog-governor-service-rest/go-client"
	"net/http"
)

// MockClustersApi is a mock of the ClustersApi interface
type MockClustersApi struct {
}

// NewMockClustersApi creates a new mock instance
func NewMockClustersApi() *MockClustersApi {
	return &MockClustersApi{}
}

func (m *MockClustersApi) FetchAgentConfig(ctx context.Context, clusterId string) openapi.ApiFetchAgentConfigRequest {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) FetchAgentConfigExecute(r openapi.ApiFetchAgentConfigRequest) (string, *http.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) GetCluster(ctx context.Context, clusterId string) openapi.ApiGetClusterRequest {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) GetClusterExecute(r openapi.ApiGetClusterRequest) (*openapi.KubernetesClusterDetailedResponse, *http.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) GetClusters(ctx context.Context) openapi.ApiGetClustersRequest {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) GetClustersExecute(r openapi.ApiGetClustersRequest) ([]openapi.KubernetesClusterResponse, *http.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) RegisterCluster(ctx context.Context) openapi.ApiRegisterClusterRequest {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) RegisterClusterExecute(r openapi.ApiRegisterClusterRequest) (*http.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) UnregisterCluster(ctx context.Context, clusterId string) openapi.ApiUnregisterClusterRequest {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) UnregisterClusterExecute(r openapi.ApiUnregisterClusterRequest) (*http.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (m *MockClustersApi) UpdateTelemetry(ctx context.Context, clusterId string) openapi.ApiUpdateTelemetryRequest {
	return openapi.ApiUpdateTelemetryRequest{ApiService: m}
}

func (m *MockClustersApi) UpdateTelemetryExecute(r openapi.ApiUpdateTelemetryRequest) (*http.Response, error) {
	return &http.Response{StatusCode: 200}, nil
}
