package inputs

import (
	"bytes"
	"encoding/json"
	"errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"net/http"
)

// PostReport is a util function which is used by the scanners to post the report
func PostReport(exportStruct *v1alpha1.ReportData) error {
	reportBytes, err := json.Marshal(exportStruct)
	if err != nil {
		log.Error(err, "failed to marshal the report data into the protocol")
		return err
	}
	resp, err := http.Post(
		// servicename.namespace.svc.cluster.local
		"http://cnsi-exporter-service.cnsi-system.svc.cluster.local:6780/forward",
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
