package api

type JobStatus struct {
	JobID  string     `json:"jobID"`
	Status ScanStatus `json:"status"`
	Msg    string     `json:"msg"`
}

type ScanStatus int

const (
	ScanStatusUnspecified ScanStatus = 0 // unspecified
	ScanStatusRunning     ScanStatus = 1 // running
	ScanStatusFinished    ScanStatus = 2 // finished
	ScanStatusFailed      ScanStatus = 3 // failed
	ScanStatusPending     ScanStatus = 4 // pending
)

type ScanResult struct {
	JobID   string    `json:"jobID"`
	Pkg     []Package `json:"pkg"`
	Msg     string    `json:"msg"`
	Success bool      `json:"success"`
}

type Package struct {
	Name           string   `json:"name"`
	Version        string   `json:"version"`
	InstalledFiles []string `json:"installedFiles"`
}

type ErrorMsg struct {
	Msg  string `json:"msg"`
	Code int    `json:"code"`
}

type AddScanJobRequest struct {
	ImageName string `json:"imageName"`
}

type AddScanJobResponse struct {
	JobID string `json:"jobID"`
	Msg   string `json:"msg"`
}
