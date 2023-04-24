package persistence

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/harbor"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/job"
)

type Store interface {
	Create(scanJob job.ScanJob) error
	Get(scanJobID string) (*job.ScanJob, error)
	UpdateStatus(scanJobID string, newStatus job.ScanJobStatus, error ...string) error
	UpdateReport(scanJobID string, report harbor.ScanReport) error
}
