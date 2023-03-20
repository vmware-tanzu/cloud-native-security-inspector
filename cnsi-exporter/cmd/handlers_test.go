package main

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/api/v1alpha1"
	"testing"
)

func TestUnmarshalReportData(t *testing.T) {
	testReportData := `{
	"source": "image_scanner",
    "exportConfig": {
        "openSearch": {
            "hostport": "localhost",
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
	want := v1alpha1.ReportData{
		Source: "image_scanner",
		ExportConfig: v1alpha1.ExportConfig{
			OpenSearch: v1alpha1.OpensearchOutputConfig{
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
