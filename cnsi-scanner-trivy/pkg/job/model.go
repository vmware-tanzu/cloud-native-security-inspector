package job

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/harbor"
)

type ScanJobStatus int

const (
	Queued ScanJobStatus = iota
	Pending
	Finished
	Failed
)

func (s ScanJobStatus) String() string {
	if s < 0 || s > 3 {
		return "Unknown"
	}
	return [...]string{"Queued", "Pending", "Finished", "Failed"}[s]
}

type ScanJob struct {
	ID     string            `json:"id"`
	Status ScanJobStatus     `json:"status"`
	Error  string            `json:"error"`
	Report harbor.ScanReport `json:"report"`
}
