package main

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/types"
	"testing"
)

func TestUnmarshalReportData(t *testing.T) {
	testReportData := `{
    "config": {
        "openSearch": {
            "host_port": "localhost",
            "index": "assessment_report",
            "username": "admin",
            "password": "passwd",
            "checkCert": false,
            "mutualTLS": false
        }
    },
    "payload": "{docId: container1-assessment-report}"
}`
	got, _ := unmarshalReportData(testReportData)
	want := types.ReportData{
		Config: types.Configuration{
			OpenSearch: types.OpensearchOutputConfig{
				HostPort:  "localhost",
				Index:     "assessment_report",
				Username:  "admin",
				Password:  "passwd",
				CheckCert: false,
				MutualTLS: false,
			},
		},
		Payload: "{docId: container1-assessment-report}",
	}
	if *got != want {
		t.Errorf("got %v, wanted %v", got, want)
	}
}
