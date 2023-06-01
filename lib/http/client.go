// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package ScannerClient

import (
	"encoding/json"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/harbor"
	"io"
	"net/http"
	"strings"
)

func Scan(url string, scanRequest harbor.ScanRequest) (string, error) {
	client := &http.Client{}

	requestBody, err := json.Marshal(scanRequest)
	if err != nil {
		return "", err
	}
	request, err := http.NewRequest(http.MethodPost, url, strings.NewReader(string(requestBody)))

	if err != nil {
		panic(err)
	}

	response, _ := client.Do(request)

	buf, err := io.ReadAll(response.Body)
	resp := &harbor.ScanResponse{}
	if err := json.Unmarshal(buf, resp); err != nil {
		return "", err
	}

	status := response.StatusCode
	if status != http.StatusAccepted {
		return "", errors.New("HTTP unaccepted")
	}

	return resp.ID, nil
}

func GetReport(id string, url string) (string, error) {
	client := &http.Client{}

	//url := "http://127.0.0.1:30033/api/v1/scan/" + id + "/report"

	request, err := http.NewRequest(http.MethodGet, url, nil)

	if err != nil {
		panic(err)
	}

	response, err := client.Do(request)
	if err != nil {
		return "", err
	}
	buf, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}
	status := response.StatusCode
	if status != http.StatusAccepted && status != http.StatusOK {
		return "", errors.New("HTTP unaccepted")
	}

	return string(buf), err
}

//func main() {
//	r := harbor.ScanRequest{
//		Registry: harbor.Registry{"http://10.212.47.157"},
//		Artifact: harbor.Artifact{"library/grafana", "sha256:19f61fb673fe3e8de42e0a1b8ffe84cb78d39385b9a8480e8288f304a783c813", ""},
//	}
//	id, _ := Scan("http://127.0.0.1:30003/api/v1/scan", r)
//
//	report, _ := GetReport(id)
//	fmt.Print(report)
//}
