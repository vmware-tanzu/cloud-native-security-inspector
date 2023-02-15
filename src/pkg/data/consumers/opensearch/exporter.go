package consumers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/opensearch-project/opensearch-go"
	"github.com/opensearch-project/opensearch-go/opensearchapi"
	"github.com/pkg/errors"
	api "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspection/data"
	"k8s.io/apiserver/pkg/storage/names"
	"strconv"
	"strings"
	"time"
)

var (
	indexName = "assessment_report"
)

type OpenSearchExporter struct {
	Client    *opensearch.Client
	indexName string
	hostname  string
}

type OpenSearchIndex struct {
	IndexName string
	Health    string
	DocCount  string
}

func (o *OpenSearchExporter) NewExporter(client *opensearch.Client, indexName string) error {
	if client == nil {
		log.Info("OpenSearch client error", errors.New("Invalid OpenSearch client"), nil)
		return errors.Errorf("OpenSearch client error: %s", errors.New("Invalid OpenSearch client"))
	}
	o.Client = client
	o.indexName = indexName
	if result, err := o.indexExists(indexName); err != nil {
		if !result {
			// No index for CNSI has been detected. A new index will be created.
			if err = o.setupIndex(); err != nil {
				return err
			}
		} else {
			// Other error or index already exists
			return err
		}
	}
	return nil
}

// Save implements Exporter
func (o *OpenSearchExporter) Save(doc api.AssessmentReport) error {
	var res *opensearchapi.Response

	for _, nsa := range doc.Spec.NamespaceAssessments {
		for _, workloadAssessment := range nsa.WorkloadAssessments {
			for _, pod := range workloadAssessment.Workload.Pods {
				for _, container := range pod.Containers {
					var esDoc consumers.AssessmentReportDoc
					esDoc.DocId = container.Name + "_" + strings.Replace(container.ID, "/", "-", -1) + "_" + doc.Name
					esDoc.UID = string(doc.UID)
					esDoc.Namespace = pod.Namespace
					b, err := json.Marshal(workloadAssessment.ActionEnforcements)
					if err == nil {
						esDoc.ActionEnforcement = string(b)
					}
					esDoc.Passed = strconv.FormatBool(workloadAssessment.Passed)
					b, err = json.Marshal(workloadAssessment.Failures)
					if err == nil {
						esDoc.Failures = string(b)
					}
					esDoc.UID = string(doc.UID)
					esDoc.CreateTimestamp = doc.CreationTimestamp.Format(time.RFC3339)
					b, err = json.Marshal(doc.Spec.InspectionConfiguration)
					if err == nil {
						esDoc.InspectionConfiguration = string(b)
					}
					esDoc.Kind = workloadAssessment.Workload.Kind
					esDoc.ContainerName = container.Name
					esDoc.ContainerId = container.ID
					esDoc.ContainerImage = container.Image
					esDoc.ContainerImageId = container.ImageID
					esDoc.IsInit = strconv.FormatBool(container.IsInit)
					esDocument, err := json.Marshal(esDoc)
					if err != nil {
						return err
					}

					res, err = opensearchapi.IndexRequest{
						Index:      indexName,
						DocumentID: esDoc.DocId,
						Body:       strings.NewReader(string(esDocument)),
						Refresh:    "true",
					}.Do(context.Background(), o.Client)
					if err != nil {
						log.Error(err, "Error getting response")
						return err
					}

					if res.IsError() {
						log.Infof("[%s] Error indexing document ID=%v", res.Status(), doc.GenerateName)
						return errors.New(fmt.Sprint("http error, code ", res.StatusCode))
					} else {
						// Deserialize the response into a map.
						var r map[string]interface{}
						if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
							log.Infof("Error parsing the response body: %s", err)
						} else {
							log.Info("Successfully decode the response")
						}
					}
				}
			}
		}
	}
	defer res.Body.Close()
	return nil
}

// SaveRiskReport save risk
func (o *OpenSearchExporter) SaveRiskReport(risks data.RiskCollection) error {
	var (
		res        *opensearchapi.Response
		err        error
		esDocument []byte
		report     []consumers.RiskDetail
	)

	currentTimeData := time.Now().Format(time.RFC3339)
	for s, items := range risks {
		split := strings.Split(s, ":")
		if len(split) != 4 {
			log.Info("key non-standard:" + s)
			continue
		}
		kind := split[0]
		name := split[1]
		namespace := split[2]
		uid := split[3]

		var esDoc consumers.RiskDetail
		esDoc.Kind = kind
		esDoc.Name = name
		esDoc.Namespace = namespace
		esDoc.Uid = uid
		esDoc.Detail = items
		esDoc.CreateTimestamp = currentTimeData
		esDocument, err = json.Marshal(esDoc)
		if err != nil {
			return err
		}
		res, err = opensearchapi.IndexRequest{
			Index:      "risk_manager_details",
			DocumentID: uid,
			Body:       strings.NewReader(string(esDocument)),
			Refresh:    "true",
		}.Do(context.Background(), o.Client)
		if err != nil {
			log.Error(err, "Error getting response")
			return err
		}

		if res.IsError() {
			log.Infof("[%s] Error indexing document ID=%v", res.Status(), uid)
			continue
		} else {
			// Deserialize the response into a map.
			var r map[string]interface{}
			if err = json.NewDecoder(res.Body).Decode(&r); err != nil {
				log.Errorf("Error parsing the response body: %s", err)
			} else {
				log.Info("Detail OK")
				report = append(report, esDoc)
			}
		}
	}

	var esDoc consumers.RiskReport
	esDoc.ReportDetail = report
	esDoc.CreateTimestamp = currentTimeData
	esDocument, err = json.Marshal(esDoc)
	if err != nil {
		return err
	}
	dId := "Package-Report_" + currentTimeData
	res, err = opensearchapi.IndexRequest{
		Index:      "risk_manager_report",
		DocumentID: dId,
		Body:       strings.NewReader(string(esDocument)),
		Refresh:    "true",
	}.Do(context.Background(), o.Client)
	if err != nil {
		log.Error(err, "Error getting response")
		return err
	}

	if res.IsError() {
		log.Infof("[%s] Error indexing document ID=%v", res.Status(), dId)
	} else {
		// Deserialize the response into a map.
		var r map[string]interface{}
		if err = json.NewDecoder(res.Body).Decode(&r); err != nil {
			log.Errorf("Error parsing the response body: %s", err)
		} else {
			log.Info("Report OK")
		}
	}

	defer res.Body.Close()

	return nil
}

// SaveCIS implements Exporter
func (o *OpenSearchExporter) SaveCIS(controlsCollection []*check.Controls) error {
	currentTimeData := time.Now().Format(time.RFC3339)
	var res *opensearchapi.Response
	for _, control := range controlsCollection {
		var report consumers.CISReport
		report.CreateTimestamp = currentTimeData
		report.NodeName = o.hostname
		report.Controls = *control
		doc, err := json.Marshal(report)

		if err != nil {
			return err
		}

		res, err = opensearchapi.IndexRequest{
			Index:      o.indexName,
			DocumentID: "kubebench-Report_" + currentTimeData + "_" + names.SimpleNameGenerator.GenerateName(""),
			Body:       strings.NewReader(string(doc)),
			Refresh:    "true",
		}.Do(context.Background(), o.Client)
		if err != nil {
			log.Error(err, "Error getting response")
			return err
		}

		if res.IsError() {
			log.Infof("[%s] Error indexing document ID=%v", res.Status(), "name-name")
			return errors.New(fmt.Sprint("http error, code ", res.StatusCode))
		} else {
			// Deserialize the response into a map.
			var r map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
				log.Infof("Error parsing the response body: %s", err)
			} else {
				log.Info("Successfully decode the response")
			}
		}

	}
	return nil
}

// Delete implements Exporter
func (o *OpenSearchExporter) Delete(doc api.AssessmentReport) error {
	return nil
}

// Search implements Exporter
func (o *OpenSearchExporter) Search(query string, after ...string) ([]consumers.AssessmentReportDoc, error) {
	return nil, nil
}

// List implements Exporter
func (o *OpenSearchExporter) List() (api.AssessmentReportList, error) {
	return api.AssessmentReportList{}, nil
}

// List the index in ElasticSearch by name
func (o *OpenSearchExporter) listIndex(name string) ([]OpenSearchIndex, error) {
	res, err := opensearchapi.CatIndicesRequest{
		Index:  []string{name},
		Format: "JSON",
	}.Do(context.Background(), o.Client)

	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	var r map[string]interface{}
	var osIndices []OpenSearchIndex
	if res.IsError() {
		if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
			log.Info("Error parsing the response body")
		} else {
			errRes := r["error"]
			r = errRes.(map[string]interface{})
		}
		return nil, errors.New(fmt.Sprint("http error, code ", res.StatusCode, "  Root cause:", r["root_cause"]))
	} else {
		// Deserialize the response into a map.
		var r []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
			log.Info("Error parsing the response body")
		} else {
			// Print the response status.
			for _, i := range r {
				var (
					index    string
					health   string
					docCount string
				)
				index, _ = i["index"].(string)
				health, _ = i["health"].(string)
				docCount, _ = i["docs.count"].(string)
				osIndices = append(osIndices, OpenSearchIndex{index, health, docCount})
			}
		}
	}
	return osIndices, nil
}

// setupIndex is to create an index with predefine mapping in OpenSearch for CNSI
func (o *OpenSearchExporter) setupIndex() error {
	var mapping string
	if o.indexName == "cis_report" {
		mapping = `{
		"mappings": {
			"properties": {
			  "docId":         { "type": "keyword" },
			  "id":  { "type": "text" },
			  "version":      { "type": "text", "analyzer": "english" },
			  "detected_version":        { "type": "text", "analyzer": "english" },
			  "text": { "type": "keyword" },
			  "node_type":  { "type": "keyword" },
              "node_name": {"type": "keyword"},
			  "section":       { "type": "keyword" },
			  "type":       { "type": "keyword" },
			  "pass":       { "type": "keyword" },
			  "fail":       { "type": "keyword" },
			  "warn":       { "type": "keyword" },
			  "info":       { "type": "keyword" },
			  "desc":       { "type": "keyword" },
			  "test_number":       { "type": "keyword" },
			  "test_desc":       { "type": "keyword" },
			  "audit":       { "type": "text" },
			  "audit_env":       { "type": "text" },
			  "audit_config":       { "type": "text" },
			  "remediation":       { "type": "text" },
			  "test_info":       { "type": "text" },
			  "status":       { "type": "keyword" },
			  "actual_value":       { "type": "text" },
			  "scored":       { "type": "text" },
			  "expected_result":       { "type": "text" },
			  "reason":       { "type": "text" },
              "createTime":   { "type": "date" }
				}
			}
		}`
	} else if o.indexName == "assessment_report" {
		mapping = `{
		"mappings": {
			"properties": {
			  "docId":         { "type": "keyword" },
			  "containerId":  { "type": "keyword" },
			  "containerName":      { "type": "keyword" },
			  "containerImage":        { "type": "keyword" },
			  "containerImageId": { "type": "keyword" },
			  "isInit":  { "type": "keyword" },
			  "kind":       { "type": "keyword" },
			  "workloadName":       { "type": "keyword" },
			  "workloadNamespace":       { "type": "keyword" },
			  "actionEnforcement":       { "type": "keyword" },
			  "passed":       { "type": "keyword" },
			  "Failures":       { "type": "text", "analyzer": "english" },
			  "reportUID":       { "type": "text", "analyzer": "english" },
			  "createTime":       { "type": "date" },
			  "inspectionConfiguration":       { "type": "text", "analyzer": "english" }
				}
			}
		}`
	} else if o.indexName == "risk_manager_details" {
		mapping = `{
		"mappings": {
			"properties": {
			  "kind":          { "type": "keyword" },
			  "name":          { "type": "keyword" },
			  "namespace":     { "type": "keyword" },
			  "uid":           { "type": "keyword" },
			  "score":         { "type": "keyword" },
			  "scale":         { "type": "keyword" },
			  "reason":        { "type": "text" },
                          "package":       { "type": "keyword" },
                          "version":       { "type": "keyword" },
                          "fix_version":   { "type": "keyword" },
                          "description":   { "type": "text" },
			  "createTime":    { "type": "date" }
				}
			}
		}`
	} else if o.indexName == "risk_manager_report" {
		mapping = `{
		"mappings": {
			"properties": {
			  "kind":          { "type": "keyword" },
			  "name":          { "type": "keyword" },
			  "namespace":     { "type": "keyword" },
			  "uid":           { "type": "keyword" },
			  "score":         { "type": "keyword" },
			  "scale":         { "type": "keyword" },
			  "reason":        { "type": "text" },
                          "package":       { "type": "keyword" },
                          "version":       { "type": "keyword" },
                          "fix_version":   { "type": "keyword" },
                          "description":   { "type": "text" },
			  "createTime":    { "type": "date" }
				}
			}
		}`
	}

	res, err := o.Client.Indices.Create(o.indexName, o.Client.Indices.Create.WithBody(strings.NewReader(mapping)))
	if err != nil {
		return err
	}
	if res.IsError() {
		return fmt.Errorf("error: %s", res)
	}
	return nil
}

// Check if the index has already been created.
func (o *OpenSearchExporter) indexExists(name string) (bool, error) {
	result, err := o.listIndex(name)
	if err != nil {
		return false, err
	} else {
		for _, item := range result {
			if item.IndexName == name {
				return true, nil
			}
		}
		return false, nil
	}
}

// WithHostname sets hostname.
func (o *OpenSearchExporter) WithHostname(hostname string) *OpenSearchExporter {
	o.hostname = hostname
	return o
}
