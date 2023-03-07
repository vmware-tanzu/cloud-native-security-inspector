package inputs

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"net/http"
	"os"
)

// PostReport is a util function which is used by the scanners to post the report
func PostReport(exportStruct *v1alpha1.ReportData) error {
	reportBytes, err := json.Marshal(exportStruct)
	if err != nil {
		log.Error(err, "failed to marshal the report data into the protocol")
		return err
	}
	var ns string
	if b, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/namespace"); err != nil {
		log.Error(err, "failed to read the namespace from file")
		ns = "cnsi-system"
	} else {
		ns = string(b)
	}
	resp, err := http.Post(
		// servicename.namespace.svc.cluster.local
		fmt.Sprintf("http://cnsi-exporter-service.%s.svc.cluster.local:6780/forward", ns),
		"application/json; charset=utf-8",
		bytes.NewReader(reportBytes),
	)
	if err != nil {
		log.Error(err, "failed to post the report to the exporter")
		return err
	}
	if resp.StatusCode != 200 {
		err = errors.New("unexpected return code from exporter")
		log.Error(err, resp.StatusCode)
	} else {
		log.Info("send the report to exporter successfully")
	}
	return nil
}
