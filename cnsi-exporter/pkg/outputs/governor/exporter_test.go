package consumers

import (
	"errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	openapi "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-exporter/pkg/outputs/governor/go-client"
	openapi_mocks "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-exporter/pkg/outputs/governor/mocks"
	itypes "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/assets/workload"
	cspauth_mocks "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/cspauth/mocks"
	v1 "k8s.io/api/core/v1"
	"net/http"
	"testing"
)

var (
	clusterID         = "testingId"
	apiToken          = "apiToken"
	namespace         = "testingNamespace"
	name              = "name"
	image             = "image"
	imageID           = "imageId"
	id                = "6e476de6-168b-4d75-9b9d-a8802333969a"
	replicaCount      = 2
	testHeader        = "testHeader"
	testHeaderValue   = "testHeaderValue"
	testApiTokentoken = "test-access-token"
	testCspSecretName = "cspSecretName"
)

const (
	testHost       = "clusterapi.swagger.io:80"
	testInvalidURL = "asdfdasfasv.sadfdsf"
	testScheme     = "http"
)

func TestSendReportToGovernor(t *testing.T) {

	testDataStruct := []struct {
		testCaseDescription string
		testHost            string
		testHeader          string
		testHeaderValue     string
		testReportData      *itypes.WorkloadReport
		testClusterID       string
		testAPIToken        string
		testStatusCode      int
		testSecretName      string
		createCSPProvider   bool
		authToken           string
	}{
		{
			testCaseDescription: "Success: Happy flow end to end.",
			testHost:            testHost,
			testHeader:          testHeader,
			testHeaderValue:     "testvalue",
			testReportData: &itypes.WorkloadReport{
				NamespaceInfos: []*itypes.NamespaceInfo{{Namespace: v1.LocalObjectReference{
					Name: namespace,
				},
					WorkloadInfos: []*itypes.WorkloadInfo{{Workload: workload.Workload{
						Pods: []*workload.Pod{{Containers: []*workload.Container{{
							Name:    name,
							Image:   image,
							ID:      id,
							ImageID: imageID,
						}}}}}}}}}},
			testClusterID:     clusterID,
			testAPIToken:      apiToken,
			testStatusCode:    http.StatusNoContent,
			testSecretName:    testCspSecretName,
			createCSPProvider: true,
			authToken:         testApiTokentoken,
		},
		{
			testCaseDescription: "Success: Empty payload, successful case",
			testHost:            testHost,
			testHeader:          testHeader,
			testHeaderValue:     testHeaderValue,
			testReportData:      &itypes.WorkloadReport{},
			testClusterID:       clusterID,
			testAPIToken:        apiToken,
			testStatusCode:      http.StatusNoContent,
			testSecretName:      testCspSecretName,
			createCSPProvider:   true,
			authToken:           testApiTokentoken,
		},
		{
			testCaseDescription: "Failure: Error from API call.",
			testHost:            testHost,
			testHeader:          testHeader,
			testHeaderValue:     testHeaderValue,
			testReportData:      &itypes.WorkloadReport{},
			testClusterID:       clusterID,
			testAPIToken:        apiToken,
			testStatusCode:      http.StatusInternalServerError,
			testSecretName:      testCspSecretName,
			createCSPProvider:   true,
			authToken:           testApiTokentoken,
		},
		{
			testCaseDescription: "Failure Invalid URL: Error from api.",
			testHost:            testInvalidURL,
			testHeader:          testHeader,
			testHeaderValue:     testHeaderValue,
			testReportData:      &itypes.WorkloadReport{},
			testClusterID:       clusterID,
			testAPIToken:        apiToken,
			testStatusCode:      http.StatusBadRequest,
			testSecretName:      testCspSecretName,
			createCSPProvider:   true,
			authToken:           testApiTokentoken,
		},
		{
			testCaseDescription: "Failure: Timeout to receive response from api.",
			testHost:            testHost,
			testHeader:          testHeader,
			testHeaderValue:     testHeaderValue,
			testReportData:      &itypes.WorkloadReport{},
			testClusterID:       clusterID,
			testAPIToken:        apiToken,
			testStatusCode:      http.StatusRequestTimeout,
			testSecretName:      testCspSecretName,
			createCSPProvider:   true,
			authToken:           testApiTokentoken,
		},
		{
			testCaseDescription: "Failure: CSP Secret name not found",
			testHost:            testHost,
			testHeader:          testHeader,
			testHeaderValue:     testHeaderValue,
			testReportData:      &itypes.WorkloadReport{},
			testClusterID:       clusterID,
			testAPIToken:        apiToken,
			testStatusCode:      http.StatusNotFound,
			testSecretName:      "",
			createCSPProvider:   false,
			authToken:           testApiTokentoken,
		},
		{
			testCaseDescription: "Failure: Access Token not available",
			testHost:            testHost,
			testHeader:          testHeader,
			testHeaderValue:     testHeaderValue,
			testReportData:      &itypes.WorkloadReport{},
			testClusterID:       clusterID,
			testAPIToken:        apiToken,
			testStatusCode:      http.StatusNotFound,
			testSecretName:      testCspSecretName,
			createCSPProvider:   true,
			authToken:           "",
		},
	}

	for _, tt := range testDataStruct {
		t.Run(tt.testCaseDescription, func(t *testing.T) {
			var clusterClient *openapi.APIClient
			mockConfig := openapi.NewConfiguration()
			mockConfig.AddDefaultHeader(tt.testHeader, tt.testHeaderValue)
			mockConfig.Host = tt.testHost
			mockConfig.Scheme = testScheme
			clusterClient = openapi.NewAPIClient(mockConfig)

			g := GovernorExporter{
				Report:        tt.testReportData,
				ApiClient:     clusterClient,
				ClusterID:     tt.testClusterID,
				CspSecretName: tt.testSecretName,
			}
			mockAPIClient := new(openapi_mocks.ClustersApi)

			response := openapi.ApiUpdateTelemetryRequest{
				ApiService: mockAPIClient,
			}
			clusterClient.ClustersApi = mockAPIClient
			response.KubernetesTelemetryRequest(g.getAPIPayload())
			mockAPIClient.On("UpdateTelemetry", mock.Anything, mock.Anything).Return(response)
			mockAPIClient.On("UpdateTelemetryExecute", mock.Anything).Return(&http.Response{
				StatusCode: tt.testStatusCode,
			}, nil)

			provider := new(cspauth_mocks.Provider)
			if tt.authToken == "" {
				provider.On("GetBearerToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(tt.authToken, errors.New("Failed to fetch CSP auth token"))
			} else {
				provider.On("GetBearerToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(tt.authToken, nil)
			}
			g.CspProvider = provider

			errFromSendReportToGovernor := g.SendReport()
			if tt.testStatusCode != http.StatusNoContent {
				assert.Error(t, errFromSendReportToGovernor)
			} else {
				assert.NoError(t, errFromSendReportToGovernor)
			}
		})
	}
}
