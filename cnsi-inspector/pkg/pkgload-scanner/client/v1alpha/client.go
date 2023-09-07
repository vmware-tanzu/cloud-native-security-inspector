package v1alpha

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/imroc/req/v3"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client/v1alpha/api"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client/v1alpha/errcode"
)

type PkgScannerClient struct {
	// http.Client
	network string
	address string
	client  *req.Client

	// timeout
	timeout         time.Duration
	pollingInterval time.Duration

	// retry times
	retry int
}

func newHttpClientUnixSocket(network, address string) *req.Client {
	client := req.C()

	switch network {
	case "unix":
		client.SetUnixSocket(address)
		client.SetBaseURL("http://example.local")
	case "tcp":
		client.SetBaseURL(address)
	}

	return client
}

// ScanPkgInfo implements client.PkgInfoClient
func (psc *PkgScannerClient) ScanImage(ctx context.Context, imageName string) (*api.ScanResult, error) {
	if imageName == "" {
		return &api.ScanResult{}, errcode.ErrInvalidImageName
	}

	// try to add scan job
	ctx4addScanJob, cancelFunc := context.WithTimeout(ctx, psc.timeout)
	defer cancelFunc()
	jobID, err := psc.addScanJob(ctx4addScanJob, imageName)
	if err != nil {
		return &api.ScanResult{JobID: jobID}, err
	}

	// polling running status
pollingLoop:
	for {
		status, err := psc.getScanJobStatus(ctx, jobID)
		if err != nil {
			if errors.Is(err, errcode.ErrUnknownJobID) {
				return &api.ScanResult{JobID: jobID}, err
			}
			return &api.ScanResult{JobID: jobID}, fmt.Errorf("%w,msg:%s", errcode.ErrUnknown, err.Error())
		}

		// NOTE: just in case, not gonna happen
		if status == nil {
			return &api.ScanResult{JobID: jobID}, fmt.Errorf("%w,msg:JobStatus is nil", errcode.ErrUnknown)
		}

		switch status.Status {
		case api.ScanStatusRunning:
			time.Sleep(psc.pollingInterval)
			continue
		case api.ScanStatusFinished:
			break pollingLoop
		case api.ScanStatusFailed:
			return &api.ScanResult{JobID: jobID}, fmt.Errorf("%w,msg:%s", errcode.ErrScanFailed, status.Msg)
		}
	}

	// get result
	ctx4getScanResult, cancel := context.WithTimeout(ctx, psc.timeout)
	defer cancel()
	scanResult, err := psc.getScanJobResult(ctx4getScanResult, jobID)
	if err != nil {
		return scanResult, err
	}

	return scanResult, nil
}

// getScanJobStatus low level api
func (psc *PkgScannerClient) ping(ctx context.Context) error {
	resp, err := psc.client.R().
		EnableDump(). // Enable dump at request level, only print dump content if there is an error or some unknown situation occurs to help troubleshoot.
		Get("/ping")

	if err != nil { // Error handling.
		log.Println("error:", err)
		log.Println("raw content:")
		log.Println(resp.Dump()) // Record raw content when error occurs.
		return fmt.Errorf("%w,msg:%w", errcode.ErrUnknown, err)
	}

	if resp.IsErrorState() { // Status code >= 400.
		return fmt.Errorf("%w,msg:%d", errcode.ErrUnknown, resp.GetStatusCode())
	}

	if resp.IsSuccessState() { // Status code is between 200 and 299.
		return nil
	}

	// Unknown status code.
	log.Println("unknown status", resp.Status)
	log.Println("raw content:")
	log.Println(resp.Dump()) // Record raw content when server returned unknown status code.

	return nil
}

// getScanJobStatus low level api
func (psc *PkgScannerClient) getScanJobStatus(ctx context.Context, jobID string) (*api.JobStatus, error) {
	var result api.JobStatus
	var errMsg api.ErrorMsg
	resp, err := psc.client.R().
		SetQueryParam("jobID", jobID).
		SetSuccessResult(&result). // Unmarshal response body into userInfo automatically if status code is between 200 and 299.
		SetErrorResult(&errMsg).   // Unmarshal response body into errMsg automatically if status code >= 400.
		EnableDump().              // Enable dump at request level, only print dump content if there is an error or some unknown situation occurs to help troubleshoot.
		Get("/check_scan_job")

	if err != nil { // Error handling.
		log.Println("error:", err)
		log.Println("raw content:")
		log.Println(resp.Dump()) // Record raw content when error occurs.
		return nil, fmt.Errorf("%w,msg:%w", errcode.ErrUnknown, err)
	}

	if resp.IsErrorState() { // Status code >= 400.
		fmt.Println(errMsg.Msg) // Record error message returned.
		return nil, fmt.Errorf("%w,msg:%s", errcode.GetErr(errMsg.Code), errMsg.Msg)
	}

	if resp.IsSuccessState() { // Status code is between 200 and 299.
		return &result, nil
	}

	// Unknown status code.
	log.Println("unknown status", resp.Status)
	log.Println("raw content:")
	log.Println(resp.Dump()) // Record raw content when server returned unknown status code.

	return nil, nil
}

// getScanJobResult low level api
func (psc *PkgScannerClient) getScanJobResult(ctx context.Context, jobID string) (*api.ScanResult, error) {
	var result api.ScanResult
	var errMsg api.ErrorMsg
	resp, err := psc.client.R().
		SetQueryParam("jobID", jobID).
		SetSuccessResult(&result). // Unmarshal response body into userInfo automatically if status code is between 200 and 299.
		SetErrorResult(&errMsg).   // Unmarshal response body into errMsg automatically if status code >= 400.
		EnableDump().              // Enable dump at request level, only print dump content if there is an error or some unknown situation occurs to help troubleshoot.
		Get("/get_scan_result")

	if err != nil { // Error handling.
		log.Println("error:", err)
		log.Println("raw content:")
		log.Println(resp.Dump()) // Record raw content when error occurs.
		return nil, fmt.Errorf("%w,msg:%w", errcode.ErrUnknown, err)
	}

	if resp.IsErrorState() { // Status code >= 400.
		fmt.Println(errMsg.Msg) // Record error message returned.
		return nil, fmt.Errorf("%w,msg:%s", errcode.GetErr(errMsg.Code), errMsg.Msg)
	}

	if resp.IsSuccessState() { // Status code is between 200 and 299.
		return &result, nil
	}

	// Unknown status code.
	log.Println("unknown status", resp.Status)
	log.Println("raw content:")
	log.Println(resp.Dump()) // Record raw content when server returned unknown status code.

	return nil, nil
}

// addScanJob low level api
func (psc *PkgScannerClient) addScanJob(ctx context.Context, imageName string) (jobId string, err error) {
	var addResp api.AddScanJobResponse
	var errMsg api.ErrorMsg
	resp, err := psc.client.R().
		SetBody(&api.AddScanJobRequest{ImageName: imageName}).
		SetSuccessResult(&addResp). // Unmarshal response body into userInfo automatically if status code is between 200 and 299.
		SetErrorResult(&errMsg).    // Unmarshal response body into errMsg automatically if status code >= 400.
		EnableDump().               // Enable dump at request level, only print dump content if there is an error or some unknown situation occurs to help troubleshoot.
		Post("/add_scan_job")

	if err != nil { // Error handling.
		log.Println("error:", err)
		log.Println("raw content:")
		log.Println(resp.Dump()) // Record raw content when error occurs.
		return "", fmt.Errorf("%w,msg:%w", errcode.ErrUnknown, err)
	}

	if resp.IsErrorState() { // Status code >= 400.
		fmt.Println(errMsg.Msg) // Record error message returned.
		return "", fmt.Errorf("%w,msg:%s", errcode.GetErr(errMsg.Code), errMsg.Msg)
	}

	if resp.IsSuccessState() { // Status code is between 200 and 299.
		return addResp.JobID, nil
	}

	// Unknown status code.
	log.Println("unknown status", resp.Status)
	log.Println("raw content:")
	log.Println(resp.Dump()) // Record raw content when server returned unknown status code.

	return "", nil
}

func NewClient(network string, address string) *PkgScannerClient {
	return &PkgScannerClient{
		network: network,
		address: address,
		// default setting
		timeout:         time.Millisecond * 100,
		pollingInterval: time.Second * 1,
		retry:           5,
		client:          newHttpClientUnixSocket(network, address),
	}
}
