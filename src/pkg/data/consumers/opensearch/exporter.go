package consumers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/opensearch-project/opensearch-go"
	"github.com/opensearch-project/opensearch-go/opensearchapi"
	"github.com/pkg/errors"
	api "github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/inspection/data"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"strconv"
	"strings"
	"time"

	"github.com/go-logr/logr"
)

var (
	ctrlLog   = ctrl.Log.WithName("OpenSearchExporter")
	indexName = "assessment_report"
)

type OpenSearchExporter struct {
	Client    *opensearch.Client
	Logger    logr.Logger
	indexName string
}

type OpenSearchIndex struct {
	IndexName string
	Health    string
	DocCount  string
}

func (o *OpenSearchExporter) NewExporter(client *opensearch.Client, indexName string) error {
	if client == nil {
		log.Log.Info("ElasticSearch client error", errors.New("Invalid ElasticSearch client"), nil)
		return errors.Errorf("ElasticSearch client error: %s", errors.New("Invalid ElasticSearch client"))
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
						ctrlLog.Error(err, "Error getting response")
						return err
					}

					if res.IsError() {
						ctrlLog.Info("[%s] Error indexing document ID=%v", res.Status(), doc.GenerateName)
						return errors.New(fmt.Sprint("http error, code ", res.StatusCode))
					} else {
						// Deserialize the response into a map.
						var r map[string]interface{}
						if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
							ctrlLog.Info("Error parsing the response body: %s", err)
						} else {
							fmt.Println("OK")
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
	)
	for s, items := range risks {
		detail, _ := json.Marshal(items)
		var esDoc consumers.RiskReportDoc
		esDoc.DocId = s
		esDoc.Detail = string(detail)
		esDoc.CreateTimestamp = time.Now().Format(time.RFC3339)
		esDocument, err = json.Marshal(esDoc)
		if err != nil {
			return err
		}
		res, err = opensearchapi.IndexRequest{
			Index:      o.indexName,
			DocumentID: s,
			Body:       strings.NewReader(string(esDocument)),
			Refresh:    "true",
		}.Do(context.Background(), o.Client)
		if err != nil {
			ctrlLog.Error(err, "Error getting response")
			return err
		}

		if res.IsError() {
			ctrlLog.Info("[%s] Error indexing document ID=%v", res.Status(), s)
			return errors.New(fmt.Sprint("http error, code ", res.StatusCode))
		} else {
			// Deserialize the response into a map.
			var r map[string]interface{}
			if err = json.NewDecoder(res.Body).Decode(&r); err != nil {
				ctrlLog.Info("Error parsing the response body: %s", err)
			} else {
				fmt.Println("OK")
			}
		}
	}

	defer res.Body.Close()

	return nil
}

func (o *OpenSearchExporter) SaveCIS(controlsCollection []*check.Controls) error {
	return nil
}

func (o *OpenSearchExporter) Delete(doc api.AssessmentReport) error {
	return nil
}

func (o *OpenSearchExporter) Search(query string, after ...string) ([]consumers.AssessmentReportDoc, error) {
	return nil, nil
}

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
	var esIndices []OpenSearchIndex
	if res.IsError() {
		if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
			log.Log.Info("Error parsing the response body: %s", err)
		} else {
			errRes := r["error"]
			r = errRes.(map[string]interface{})
		}
		return nil, errors.New(fmt.Sprint("http error, code ", res.StatusCode, "  Root cause:", r["root_cause"]))
	} else {
		// Deserialize the response into a map.
		var r []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
			log.Log.Info("Error parsing the response body: %s", err)
		} else {
			// Print the response status.
			for _, i := range r {
				esIndices = append(esIndices, OpenSearchIndex{i["index"].(string), i["health"].(string),
					i["docs.count"].(string)})
			}
		}
	}
	return esIndices, nil
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
			  "text": { "type": "text", "analyzer": "english" },
			  "node_type":  { "type": "text" },
			  "section":       { "type": "text" },
			  "type":       { "type": "text" },
			  "pass":       { "type": "text" },
			  "fail":       { "type": "text" },
			  "warn":       { "type": "text" },
			  "info":       { "type": "text" },
			  "desc":       { "type": "text" },
			  "test_number":       { "type": "text" },
			  "test_desc":       { "type": "text" },
			  "audit":       { "type": "text" },
			  "audit_env":       { "type": "text" },
			  "audit_config":       { "type": "text" },
			  "remediation":       { "type": "text" },
			  "test_info":       { "type": "text" },
			  "status":       { "type": "text" },
			  "actual_value":       { "type": "text" },
			  "scored":       { "type": "text" },
			  "expected_result":       { "type": "text" },
			  "reason":       { "type": "text" }
				}
			}
		}`
	} else if o.indexName == "assessment_report" {
		mapping = `{
		"mappings": {
			"properties": {
			  "docId":         { "type": "keyword" },
			  "containerId":  { "type": "text" },
			  "containerName":      { "type": "text", "analyzer": "english" },
			  "containerImage":        { "type": "text", "analyzer": "english" },
			  "containerImageId": { "type": "text", "analyzer": "english" },
			  "isInit":  { "type": "text" },
			  "kind":       { "type": "text" },
			  "workloadName":       { "type": "text", "analyzer": "english" },
			  "workloadNamespace":       { "type": "text", "analyzer": "english" },
			  "actionEnforcement":       { "type": "text", "analyzer": "english" },
			  "passed":       { "type": "text", "analyzer": "english" },
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
			  "docId":         { "type": "keyword" },
			  "detail":  { "type": "text" },
			  "createTime":       { "type": "date" },
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
