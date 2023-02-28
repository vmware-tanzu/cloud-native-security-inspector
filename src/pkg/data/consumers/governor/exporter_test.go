package consumers

import (
	"context"
	"errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	api "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/cspauth/mocks"
	openapi "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/governor/go-client"
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
		testReportData      *api.AssessmentReport
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
			testReportData: &api.AssessmentReport{
				Spec: api.AssessmentReportSpec{NamespaceAssessments: []*api.NamespaceAssessment{{Namespace: v1.LocalObjectReference{
					Name: namespace,
				},
					WorkloadAssessments: []*api.WorkloadAssessment{{Workload: api.Workload{Replicas: int32(replicaCount),
						Pods: []*api.Pod{{Containers: []*api.Container{{
							Name:    name,
							Image:   image,
							ImageID: imageID,
						}}}}}}}}}}},
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
			testReportData:      &api.AssessmentReport{},
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
			testReportData:      &api.AssessmentReport{},
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
			testReportData:      &api.AssessmentReport{},
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
			testReportData:      &api.AssessmentReport{},
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
			testReportData:      &api.AssessmentReport{},
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
			testReportData:      &api.AssessmentReport{},
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
				Report:    tt.testReportData,
				ApiClient: clusterClient,
				ClusterID: tt.testClusterID,
			}
			mockAPIClient := new(ClustersApi)

			response := openapi.ApiUpdateTelemetryRequest{
				ApiService: mockAPIClient,
			}
			clusterClient.ClustersApi = mockAPIClient
			response.KubernetesTelemetryRequest(g.getGovernorAPIPayload())
			mockAPIClient.On("UpdateTelemetry", mock.Anything, mock.Anything).Return(response)
			mockAPIClient.On("UpdateTelemetryExecute", mock.Anything).Return(&http.Response{
				StatusCode: tt.testStatusCode,
			}, nil)

			ctx := context.Background()
			if tt.testSecretName != "" {
				ctx = context.WithValue(ctx, "cspSecretName", tt.testSecretName)
			}

			provider := new(mocks.Provider)
			if tt.authToken == "" {
				provider.On("GetBearerToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(tt.authToken, errors.New("Failed to fetch CSP auth token"))
			} else {
				provider.On("GetBearerToken", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(tt.authToken, nil)
			}
			g.CspProvider = provider

			errFromSendReportToGovernor := g.SendReportToGovernor(ctx)
			if tt.testStatusCode != http.StatusNoContent {
				assert.Error(t, errFromSendReportToGovernor)
			} else {
				assert.NoError(t, errFromSendReportToGovernor)
			}
		})
	}
}
