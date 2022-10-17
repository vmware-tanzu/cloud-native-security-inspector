package es

import (
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	"io/ioutil"
	"testing"
)

func Test_indexDoc(t *testing.T) {
	type args struct {
		doc v1alpha1.AssessmentReport
	}
	tests := []struct {
		name string
		args args
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			indexDoc(tt.args.doc)
		})
	}
}

func Test_newClient(t *testing.T) {
	type args struct {
		cert     []byte
		addr     string
		username string
		passwd   string
	}
	var cert []byte
	cert, _ = ioutil.ReadFile("/Users/zsimon/Projects/cnsi/github/elasticsearch/http_ca.crt")
	var client *elasticsearch.Client
	tests := args{
		cert,
		"https://localhost:9201",
		"elastic",
		"vVPqNKbG-WjjukoIN4X5",
	}
	t.Run("test-case01", func(t *testing.T) {
		if client = NewClient(tests.cert, tests.addr, tests.username, tests.passwd); client == nil {
			t.Errorf("newClient() = %v", client)
		}
	})
}
