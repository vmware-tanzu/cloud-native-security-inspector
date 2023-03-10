package main

import (
	"encoding/json"
	"fmt"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/outputs"
	"io"
	"net/http"
)

func main() {
	http.HandleFunc("/forward", mainHandler)
	listenPort := 6780
	log.Infof("data exporter is up and listening on port %d", listenPort)

	if err := http.ListenAndServe(fmt.Sprintf("%s:%d", "", listenPort), nil); err != nil {
		log.Error(err)
		log.Fatalf("failed to start the data exporter server")
	}
}

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

func unmarshalReportData(reportDataStr string) (*v1alpha1.ReportData, error) {
	var reportData v1alpha1.ReportData
	if err := json.Unmarshal([]byte(reportDataStr), &reportData); err != nil {
		log.Errorf("failed to unmarshal the report data string, err: %s", err.Error())
		return nil, err
	}
	return &reportData, nil
}

func forwardEvent(reportData *v1alpha1.ReportData) {
	var enabledOutputs []string
	config := reportData.ExportConfig
	if config.OpenSearch.HostPort != "" {
		// for opensearch, we just use the source name as the index,
		// in the future we can consider how to make it configurable.
		config.OpenSearch.Index = reportData.Source
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
	if !config.Governor.Enabled || config.Governor.URL == "" || config.Governor.ClusterID == "" || config.Governor.CspSecretName == "" {
		log.Error("Either governor is not enabled or ClusterID or URL or CSPSecretName is empty")
		return
	} else {
		governorClient, err := outputs.NewClient(
			config.Governor.URL, false, false, &config)
		if err != nil {
			log.Errorf("failed to create the governor client, err: %s", err.Error())
		} else {
			go governorClient.GovernorPost(reportData.Payload)
			enabledOutputs = append(enabledOutputs, "governor")
		}
	}
	// To developers:
	// launch more goroutines to forward to other consumers
	log.Infof("the enabled outputs: %s", enabledOutputs)
}
