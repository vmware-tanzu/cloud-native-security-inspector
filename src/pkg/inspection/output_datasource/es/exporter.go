package es

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/esapi"
	"github.com/pkg/errors"
	api "github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	"io"
	ctrl "sigs.k8s.io/controller-runtime"
	"strconv"
	"strings"
	"time"
)

var (
	ctrlLog   = ctrl.Log.WithName("esExporter")
	r         map[string]interface{}
	indexName = "assessment_report_04"
)

type Exporter interface {
	Save(doc api.AssessmentReport) error
	Delete(doc api.AssessmentReport) error
	Search() (api.AssessmentReport, error)
	List() (api.AssessmentReportList, error)
}

// EsExporter ElasticSearch exporter implements output_datasource.Exporter
type EsExporter struct {
	client *elasticsearch.Client
}

const searchAll = `
	"query" : { "match_all" : {} }`

const searchMatch = `
	"query" : {
		"multi_match" : {
			"query" : %q,
			"fields" : ["kind^10", "containerName^10", "containerImage^10", "workloadNamespace^10", 
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

func (e *EsExporter) setupIndex() error {
	mapping := `{
    "mappings": {
        "properties": {
          "docId":         { "type": "keyword" },
          "containerId":  { "type": "text" },
          "containerName":      { "type": "text", "analyzer": "english" },
          "containerImage":        { "type": "text", "analyzer": "english" },
          "ContainerImageId": { "type": "text", "analyzer": "english" },
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
	res, err := e.client.Indices.Create(indexName, e.client.Indices.Create.WithBody(strings.NewReader(mapping)))
	if err != nil {
		return err
	}
	if res.IsError() {
		return fmt.Errorf("error: %s", res)
	}
	return nil
}

func (e *EsExporter) deleteIndex(index []string) error {
	res, err := e.client.Indices.Delete(index)
	if err != nil {
		return err
	}
	if res.IsError() {
		return fmt.Errorf("error: %s", res)
	}
	return nil
}

//func (e *EsExporter) Index(doc api.AssessmentReport) error {
//	response, error := e.client.Index(
//		indexName,
//		esutil.NewJSONReader(&doc),
//		e.client.Index.WithDocumentID("docID-001"),
//	)
//	if error != nil {
//		return error
//	}
//	var r map[string]interface{}
//	if err := json.NewDecoder(response.Body).Decode(&r); err != nil {
//		return err
//	} else {
//		ctrlLog.Info("[%s] %s; version=%d", response.Status(), r["result"], int(r["_version"].(float64)))
//	}
//	return nil
//}

func (e *EsExporter) Save(doc api.AssessmentReport) error {
	fmt.Println("Save")
	b, err := json.Marshal(doc)
	if err != nil {
		return err
	}
	fmt.Printf("String: %s", b)

	for _, nsa := range doc.Spec.NamespaceAssessments {
		for _, workloadAssessment := range nsa.WorkloadAssessments {
			for _, pod := range workloadAssessment.Workload.Pods {
				for _, container := range pod.Containers {
					var esDoc AssessmentReportDoc
					esDoc.DocId = container.Name + "_" + container.ID + "_" + doc.Name
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
					esDoc.CreateTimestamp = doc.CreationTimestamp.Format(time.ANSIC)
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
					fmt.Println(esDocument)

					res, err := esapi.IndexRequest{
						Index:      indexName,
						DocumentID: "id111",
						Body:       strings.NewReader(string(esDocument)),
						Refresh:    "true",
					}.Do(context.Background(), e.client)
					if err != nil {
						ctrlLog.Error(err, "Error getting response")
						return err
					}
					defer res.Body.Close()

					if res.IsError() {
						ctrlLog.Info("[%s] Error indexing document ID=%v", res.Status(), doc.GenerateName)
						fmt.Println(res.StatusCode)
						return errors.New(fmt.Sprint("http error, code ", res.StatusCode))
					} else {
						// Deserialize the response into a map.
						var r map[string]interface{}
						if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
							ctrlLog.Info("Error parsing the response body: %s", err)
						} else {
							// Print the response status and indexed document version.
							ctrlLog.Info("[%s] %s; version=%d", res.Status(), r["result"], int(r["_version"].(float64)))
						}
					}
				}
			}
		}
	}

	return nil
}

func (e *EsExporter) Delete(doc api.AssessmentReport) error {
	return nil
}

type SearchResults struct {
	Total int    `json:"total"`
	Hits  []*Hit `json:"hits"`
}
type Hit struct {
	AssessmentReportDoc
	URL        string        `json:"url"`
	Sort       []interface{} `json:"sort"`
	Highlights *struct {
		Title      []string `json:"title"`
		Alt        []string `json:"alt"`
		Transcript []string `json:"transcript"`
	} `json:"highlights,omitempty"`
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

	// fmt.Printf("%s\n", b.String())
	return strings.NewReader(b.String())
}

func (e *EsExporter) Search(query string, after ...string) ([]AssessmentReportDoc, error) {
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

	res, err := e.client.Search(
		e.client.Search.WithIndex(indexName),
		e.client.Search.WithBody(buildQuery(query, after...)),
	)
	if err != nil {
		return []AssessmentReportDoc{}, err
	}
	defer res.Body.Close()

	if res.IsError() {
		var e map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return []AssessmentReportDoc{}, err
		}
		return []AssessmentReportDoc{}, fmt.Errorf("[%s] %s: %s", res.Status(), e["error"].(map[string]interface{})["type"], e["error"].(map[string]interface{})["reason"])
	}

	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
		return []AssessmentReportDoc{}, err
	}

	results.Total = r.Hits.Total.Value

	if len(r.Hits.Hits) < 1 {
		results.Hits = []*Hit{}
		return []AssessmentReportDoc{}, nil
	}

	for _, hit := range r.Hits.Hits {
		var h Hit
		//h.ID = hit.ID
		h.Sort = hit.Sort
		//h.URL = strings.Join([]string{baseURL, h.ID, ""}, "/")

		if err := json.Unmarshal(hit.Source, &h); err != nil {
			return []AssessmentReportDoc{}, err
		}

		if len(hit.Highlights) > 0 {
			if err := json.Unmarshal(hit.Highlights, &h.Highlights); err != nil {
				return []AssessmentReportDoc{}, err
			}
		}

		results.Hits = append(results.Hits, &h)
	}
	var reportList []AssessmentReportDoc
	fmt.Printf("Results hits: %v \n", len(results.Hits))
	for _, ret := range results.Hits {
		reportList = append(reportList, ret.AssessmentReportDoc)
	}
	return reportList, nil
}
