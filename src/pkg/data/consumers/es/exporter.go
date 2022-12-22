package consumers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/esapi"
	"github.com/pkg/errors"
	api "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspection/data"
	"io"
	"k8s.io/apiserver/pkg/storage/names"
	"strconv"
	"strings"
	"time"
)

var (
	indexName = "assessment_report"
)

const searchAll = `
	"query" : { "match_all" : {} }`

const searchMatch = `
	"query" : {
		"multi_match" : {
			"query" : %q,
			"fields" : ["kind^10", "containerName^10", "containerImage^10", "containerImageId^10", "workloadNamespace^10", 
				"passed^10", "isInit^10", "actionEnforcement"],
			"operator" : "and"
		}
	},
	"highlight" : {
		"fields" : {
			"title" : { "number_of_fragments" : 0 },
			"alt" : { "number_of_fragments" : 0 },
			"transcript" : { "number_of_fragments" : 5, "fragment_size" : 25 }
		}
	},
	"size" : 25,
	"sort" : [ { "_score" : "desc" }, { "_doc" : "asc" } ]`

type Exporter interface {
	Save(doc api.AssessmentReport) error
	SaveCIS(controlsCollection []*check.Controls) error
	Delete(doc api.AssessmentReport) error
	Search(query string, after ...string) ([]consumers.AssessmentReportDoc, error)
	List() (api.AssessmentReportList, error)
}

type ElasticSearchIndex struct {
	IndexName string
	Health    string
	DocCount  string
}

type SearchResults struct {
	Total int    `json:"total"`
	Hits  []*Hit `json:"hits"`
}
type Hit struct {
	consumers.AssessmentReportDoc
	URL        string        `json:"url"`
	Sort       []interface{} `json:"sort"`
	Highlights *struct {
		Title      []string `json:"title"`
		Alt        []string `json:"alt"`
		Transcript []string `json:"transcript"`
	} `json:"highlights,omitempty"`
}

// ElasticSearchExporter ElasticSearch exporter implements output_datasource.Exporter
type ElasticSearchExporter struct {
	Client    *elasticsearch.Client
	indexName string
	hostname  string
}

func (e *ElasticSearchExporter) NewExporter(client *elasticsearch.Client, indexName string) error {
	if client == nil {
		log.Error("ElasticSearch client error", errors.New("Invalid ElasticSearch client"), nil)
		return errors.Errorf("ElasticSearch client error: %s", errors.New("Invalid ElasticSearch client"))
	}
	e.Client = client
	e.indexName = indexName
	if result, err := e.indexExists(indexName); err != nil {
		if !result {
			// No index for CNSI has been detected. A new index will be created.
			if err := e.setupIndex(); err != nil {
				return err
			}
		} else {
			// Other error or index already exists
			return err
		}
	}
	return nil
}

func buildQuery(query string, after ...string) io.Reader {
	var b strings.Builder
	b.WriteString("{\n")

	if query == "" {
		b.WriteString(searchAll)
	} else {
		b.WriteString(fmt.Sprintf(searchMatch, query))
	}

	if len(after) > 0 && after[0] != "" && after[0] != "null" {
		b.WriteString(",\n")
		b.WriteString(fmt.Sprintf(`	"search_after": %s`, after))
	}

	b.WriteString("\n}")
	return strings.NewReader(b.String())
}

// setupIndex is to create an index with predefine mapping in ElasticSearch for CNSI
func (e *ElasticSearchExporter) setupIndex() error {
	var mapping string
	if e.indexName == "cis_report" {
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
			  "status":       { "type": "text" },
			  "actual_value":       { "type": "text" },
			  "scored":       { "type": "text" },
			  "expected_result":       { "type": "text" },
			  "reason":       { "type": "text" },
			  "createTime":   { "type": "date" }
				}
			}
		}`
	} else if e.indexName == "assessment_report" {
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
	} else if e.indexName == "risk_manager_details" {
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
	} else if e.indexName == "risk_manager_report" {
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

	res, err := e.Client.Indices.Create(e.indexName, e.Client.Indices.Create.WithBody(strings.NewReader(mapping)))
	if err != nil {
		return err
	}
	if res.IsError() {
		return fmt.Errorf("error: %s", res)
	}
	return nil
}

// Check if the index has already been created.
func (e *ElasticSearchExporter) indexExists(name string) (bool, error) {
	result, err := e.listIndex(name)
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

// List the index in ElasticSearch by name
func (e *ElasticSearchExporter) listIndex(name string) ([]ElasticSearchIndex, error) {
	res, err := esapi.CatIndicesRequest{
		Index:  []string{name},
		Format: "JSON",
	}.Do(context.Background(), e.Client)

	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	var r map[string]interface{}
	var esIndices []ElasticSearchIndex
	if res.IsError() {
		if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
			log.Infof("Error parsing the response body: %s", err)
		} else {
			errRes := r["error"]
			r = errRes.(map[string]interface{})
		}
		return nil, errors.New(fmt.Sprint("http error, code ", res.StatusCode, "  Root cause:", r["root_cause"]))
	} else {
		// Deserialize the response into a map.
		var r []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
			log.Infof("Error parsing the response body: %s", err)
		} else {
			// Print the response status.
			for _, i := range r {
				esIndices = append(esIndices, ElasticSearchIndex{i["index"].(string), i["health"].(string),
					i["docs.count"].(string)})
			}
		}
	}
	return esIndices, nil
}

// Delete index
func (e *ElasticSearchExporter) deleteIndex(index []string) error {
	res, err := e.Client.Indices.Delete(index)
	if err != nil {
		return err
	}
	if res.IsError() {
		return fmt.Errorf("error: %s", res)
	}
	return nil
}

// SaveCIS implements Exporter
func (e ElasticSearchExporter) SaveCIS(controlsCollection []*check.Controls) error {
	currentTimeData := time.Now().Format(time.RFC3339)

	var res *esapi.Response
	for _, control := range controlsCollection {
		var report consumers.CISReport
		report.CreateTimestamp = currentTimeData
		report.NodeName = e.hostname
		report.Controls = *control
		doc, err := json.Marshal(report)
		if err != nil {
			return err
		}

		res, err = esapi.IndexRequest{
			Index:      e.indexName,
			DocumentID: "kubebench-Report_" + e.hostname + "_" + currentTimeData + "_" + names.SimpleNameGenerator.GenerateName(""),
			Body:       strings.NewReader(string(doc)),
			Refresh:    "true",
		}.Do(context.Background(), e.Client)
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
				log.Info("Decode successfully!")
			}
		}

	}
	return nil
}

// SaveRiskReport save risk
func (e *ElasticSearchExporter) SaveRiskReport(risks data.RiskCollection) error {
	var (
		res        *esapi.Response
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
		res, err = esapi.IndexRequest{
			Index:      "risk_manager_details",
			DocumentID: uid,
			Body:       strings.NewReader(string(esDocument)),
			Refresh:    "true",
		}.Do(context.Background(), e.Client)
		if err != nil {
			log.Error(err, "Error getting response")
			return err
		}

		if res.IsError() {
			log.Infof("[%s] Error indexing document ID=%v", res.Status(), s)
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
	res, err = esapi.IndexRequest{
		Index:      "risk_manager_report",
		DocumentID: dId,
		Body:       strings.NewReader(string(esDocument)),
		Refresh:    "true",
	}.Do(context.Background(), e.Client)
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

// Save implements Exporter
func (e ElasticSearchExporter) Save(doc api.AssessmentReport) error {
	var res *esapi.Response

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

					res, err = esapi.IndexRequest{
						Index:      indexName,
						DocumentID: esDoc.DocId,
						Body:       strings.NewReader(string(esDocument)),
						Refresh:    "true",
					}.Do(context.Background(), e.Client)
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

// Delete implements Exporter
func (e ElasticSearchExporter) Delete(doc api.AssessmentReport) error {
	return nil
}

// Search implements Exporter
func (e ElasticSearchExporter) Search(query string, after ...string) ([]consumers.AssessmentReportDoc, error) {
	type envelopeResponse struct {
		Took int
		Hits struct {
			Total struct {
				Value int
			}
			Hits []struct {
				ID         string          `json:"_id"`
				Source     json.RawMessage `json:"_source"`
				Highlights json.RawMessage `json:"highlight"`
				Sort       []interface{}   `json:"sort"`
			}
		}
	}

	var r envelopeResponse
	var results SearchResults

	res, err := e.Client.Search(
		e.Client.Search.WithIndex(indexName),
		e.Client.Search.WithBody(buildQuery(query, after...)),
	)
	if err != nil {
		return []consumers.AssessmentReportDoc{}, err
	}
	defer res.Body.Close()

	if res.IsError() {
		var e map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return []consumers.AssessmentReportDoc{}, err
		}
		return []consumers.AssessmentReportDoc{}, fmt.Errorf("[%s] %s: %s", res.Status(), e["error"].(map[string]interface{})["type"], e["error"].(map[string]interface{})["reason"])
	}

	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
		return []consumers.AssessmentReportDoc{}, err
	}

	results.Total = r.Hits.Total.Value

	if len(r.Hits.Hits) < 1 {
		results.Hits = []*Hit{}
		return []consumers.AssessmentReportDoc{}, nil
	}

	for _, hit := range r.Hits.Hits {
		var h Hit
		h.Sort = hit.Sort

		if err := json.Unmarshal(hit.Source, &h); err != nil {
			return []consumers.AssessmentReportDoc{}, err
		}

		if len(hit.Highlights) > 0 {
			if err := json.Unmarshal(hit.Highlights, &h.Highlights); err != nil {
				return []consumers.AssessmentReportDoc{}, err
			}
		}

		results.Hits = append(results.Hits, &h)
	}
	var reportList []consumers.AssessmentReportDoc
	log.Info("Results hits: ", len(results.Hits))
	for _, ret := range results.Hits {
		reportList = append(reportList, ret.AssessmentReportDoc)
	}
	return reportList, nil
}

func (e ElasticSearchExporter) getContainerUsedMost() (api.AssessmentReportList, error) {
	return api.AssessmentReportList{}, nil
}

// List implements Exporter
func (e ElasticSearchExporter) List() (api.AssessmentReportList, error) {
	return api.AssessmentReportList{}, nil
}

// WithHostname sets hostname.
func (e *ElasticSearchExporter) WithHostname(hostname string) *ElasticSearchExporter {
	e.hostname = hostname
	return e
}
