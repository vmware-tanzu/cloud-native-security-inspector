package main

import (
	"encoding/json"
	"fmt"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/outputs"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/types"
	"io"
	"net/http"
)

// mainHandler is data exporter main handler
func mainHandler(w http.ResponseWriter, r *http.Request) {
	if r.Body == nil {
		http.Error(w, "Please send a valid request body", http.StatusBadRequest)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Please send with post http method", http.StatusBadRequest)
		return
	}
	reportDataBytes, err := io.ReadAll(r.Body)
	if err != nil {
		log.Errorf("failed to read the report data from the request body, err: %s", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	reportDataStr := string(reportDataBytes)
	reportData, err := unmarshalReportData(reportDataStr)
	if err != nil {
		log.Errorf("failed to unmarshal the report data, err: %s", err.Error())
		log.Errorf("report string: %s", reportDataStr)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	forwardEvent(reportData)
}

func unmarshalReportData(reportDataStr string) (*types.ReportData, error) {
	var reportData types.ReportData
	if err := json.Unmarshal([]byte(reportDataStr), &reportData); err != nil {
		log.Errorf("failed to unmarshal the report data string, err: %s", err.Error())
		return nil, err
	}
	return &reportData, nil
}

func forwardEvent(reportData *types.ReportData) {
	var enabledOutputs []string
	config := reportData.Config
	if config.OpenSearch.HostPort != "" {
		osEndpoint := fmt.Sprintf("%s/%s/_doc", config.OpenSearch.HostPort, config.OpenSearch.Index)
		OpensearchClient, err := outputs.NewClient(
			osEndpoint, config.OpenSearch.MutualTLS, config.OpenSearch.CheckCert, &config)
		if err != nil {
			log.Errorf("failed to create the Opensearch client, err: %s", err.Error())
		} else {
			go OpensearchClient.OpenSearchPost(reportData.Payload)
			enabledOutputs = append(enabledOutputs, "openSearch")
		}
	}
	// To developers:
	// launch more goroutines to forward to other consumers
	log.Infof("the enabled outputs: %s", enabledOutputs)
}
