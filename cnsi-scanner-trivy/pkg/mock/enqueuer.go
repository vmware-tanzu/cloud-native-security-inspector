package mock

import (
	"github.com/stretchr/testify/mock"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/harbor"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/job"
)

type Enqueuer struct {
	mock.Mock
}

func NewEnqueuer() *Enqueuer {
	return &Enqueuer{}
}

func (em *Enqueuer) Enqueue(request harbor.ScanRequest) (job.ScanJob, error) {
	args := em.Called(request)
	return args.Get(0).(job.ScanJob), args.Error(1)
}
