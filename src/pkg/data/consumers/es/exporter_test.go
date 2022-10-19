package es

import (
	"encoding/json"
	"fmt"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	"io/ioutil"
	"testing"
)

type args struct {
	cert     []byte
	addr     string
	username string
	passwd   string
}

type fields struct {
	Client *elasticsearch.Client
}

func TestElasticSearchExporter_Delete(t *testing.T) {

}

func TestElasticSearchExporter_Index(t *testing.T) {
	cert, _ := ioutil.ReadFile("/Users/zsimon/Projects/cnsi/github/elasticsearch/http_ca.crt")
	tests := args{
		cert,
		"https://localhost:9201",
		"elastic",
		"vVPqNKbG-WjjukoIN4X5",
	}
	client := NewClient(tests.cert, tests.addr, tests.username, tests.passwd)
	esExporter := ElasticSearchExporter{Client: client}
	//doc := v1alpha1.AssessmentReport{"", metav1.ObjectMeta{"TestReport", "GenNanme"}}
	doc := v1alpha1.AssessmentReport{}
	file, _ := ioutil.ReadFile("/Users/zsimon/Projects/github/cnsi/cloud-native-security-inspector/src/testdata/assessment_report.json")
	json.Unmarshal(file, &doc)

	t.Run("test-name-01", func(t *testing.T) {
		err := esExporter.setupIndex()
		if err != nil {
			t.Errorf("Save() error = %v, wantErr %v", err, "")
		}
	})
}

func TestElasticSearchExporter_Save(t *testing.T) {
	cert, _ := ioutil.ReadFile("/Users/zsimon/Projects/cnsi/github/elasticsearch/operator_es.crt")
	tests := args{
		cert,
		"https://quickstart-es-http:9200",
		"elastic",
		"2NR422RahwP5NQXG971v74JY",
	}
	client := NewClient(tests.cert, tests.addr, tests.username, tests.passwd)
	var esExporter Exporter
	esExporter = ElasticSearchExporter{Client: client}

	//esExporter := ElasticSearchExporter{Client: client}
	//doc := v1alpha1.AssessmentReport{"", metav1.ObjectMeta{"TestReport", "GenNanme"}}
	doc := v1alpha1.AssessmentReport{}
	file, _ := ioutil.ReadFile("/Users/zsimon/Projects/github/cnsi/cloud-native-security-inspector/src/testdata/assessment_report.json")
	//fmt.Printf("%s", string(file))
	json.Unmarshal(file, &doc)

	t.Run("test-name-01", func(t *testing.T) {
		err := esExporter.Save(doc)
		if err != nil {
			t.Errorf("Save() error = %v, wantErr %v", err, "")
		} else {
			fmt.Println("Test OK")
		}
	})

}

func TestElasticSearchExporter_Search(t *testing.T) {
	cert, _ := ioutil.ReadFile("/Users/zsimon/Projects/cnsi/github/elasticsearch/operator_es.crt")
	testClient := args{
		cert,
		"https://quickstart-es-http:9200",
		"elastic",
		"2NR422RahwP5NQXG971v74JY",
	}
	client := NewClient(testClient.cert, testClient.addr, testClient.username, testClient.passwd)
	esExporter := ElasticSearchExporter{Client: client}

	//doc := v1alpha1.AssessmentReport{}
	//
	//file, _ := ioutil.ReadFile("/Users/zsimon/Projects/github/cnsi/cloud-native-security-inspector/src/testdata/assessment_report.json")
	//json.Unmarshal(file, &doc)

	tests := []struct {
		name    string
		keyword string
	}{
		{name: "test-01", keyword: "workload"},
		{name: "test-02", keyword: "nginx"},
		{name: "test-03", keyword: "mongo"},
		{name: "test-04", keyword: "10.78.177.224"},
		{name: "test-05", keyword: "tsi"},
		{name: "test-06", keyword: "false"},
		{name: "test-07", keyword: "Deployment"},
		{name: "test-08", keyword: "quarantine_vulnerable_workload"},
		{name: "test-09", keyword: "test"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			report, err := esExporter.Search(tt.keyword)
			if err != nil {
				t.Errorf("Search() error = %v, wantErr %v", err, "")
			} else {
				for index, report := range report {
					fmt.Printf("The report index %v : \n", index)
					fmt.Printf("DocID: %v \n", report.DocId)
					fmt.Printf("Name: %v \n", report.ContainerName)
					fmt.Printf("Kind: %v \n", report.Kind)
					fmt.Printf("Namespace: %v \n", report.Namespace)
					b, _ := json.Marshal(report)
					fmt.Printf("Report: %v \n", string(b))
					fmt.Println("=================================================")
				}
			}

		})
	}
}

func TestElasticSearchExporter_setupIndex(t *testing.T) {
	type fields struct {
		client *elasticsearch.Client
	}
	tests := []struct {
		name    string
		fields  fields
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := &ElasticSearchExporter{
				Client: tt.fields.client,
			}
			if err := e.setupIndex(); (err != nil) != tt.wantErr {
				t.Errorf("setupIndex() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestElasticSearchExporter_deleteIndex(t *testing.T) {
	cert, _ := ioutil.ReadFile("/Users/zsimon/Projects/cnsi/github/elasticsearch/operator_es.crt")
	clientArg := args{
		cert,
		"https://quickstart-es-http:9200",
		"elastic",
		"2NR422RahwP5NQXG971v74JY",
	}
	client := NewClient(clientArg.cert, clientArg.addr, clientArg.username, clientArg.passwd)
	type fields struct {
		client *elasticsearch.Client
	}
	type args struct {
		index []string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantErr bool
	}{
		{name: "test", fields: fields{nil}, args: args{[]string{
			"assessment_report"}}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := &ElasticSearchExporter{
				Client: client,
			}
			if err := e.deleteIndex(tt.args.index); (err != nil) != tt.wantErr {
				t.Errorf("deleteIndex() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestElasticSearchExporter_listIndex(t *testing.T) {
	cert, _ := ioutil.ReadFile("/Users/zsimon/Projects/cnsi/github/elasticsearch/operator_es.crt")
	tests := args{
		cert,
		"https://quickstart-es-http:9200",
		"elastic",
		"2NR422RahwP5NQXG971v74JY",
	}
	client := NewClient(tests.cert, tests.addr, tests.username, tests.passwd)
	esExporter, _ := NewExporter(client)
	t.Run("test-listIndex", func(t *testing.T) {
		if result, err := esExporter.listIndex(""); (err != nil) != false {
			t.Errorf("listIndex() error = %v, wantErr %v", err, false)
		} else {
			for _, item := range result {
				fmt.Printf("Index name: %v \n", item.IndexName)
				fmt.Printf("Index health: %v \n", item.Health)
				fmt.Printf("Index doc count: %v \n", item.DocCount)
			}
		}
	})

}
