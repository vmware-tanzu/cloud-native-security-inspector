package consumers

import (
	"github.com/opensearch-project/opensearch-go"
	"testing"
)

func TestCreateIndex(t *testing.T) {
	client := NewClient([]byte("a"), "", "admin", "admin")
	exporter := OpenSearchExporter{client, "go-test-index1", "host01"}
	exporter.NewExporter(client, "go-test-index1")
}

func TestOpenSearchExporter_NewExporter(t *testing.T) {
	type fields struct {
		Client    *opensearch.Client
		indexName string
	}
	type args struct {
		client    *opensearch.Client
		indexName string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    *OpenSearchExporter
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			o := &OpenSearchExporter{
				Client:    tt.fields.Client,
				indexName: tt.fields.indexName,
			}
			err := o.NewExporter(tt.args.client, tt.args.indexName)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewExporter() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
		})
	}
}
