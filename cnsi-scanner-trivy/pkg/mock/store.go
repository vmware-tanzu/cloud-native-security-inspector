package mock

import (
	"github.com/stretchr/testify/mock"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/harbor"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/job"
)

type Store struct {
	mock.Mock
}

func NewStore() *Store {
	return &Store{}
}

func (s *Store) Create(scanJob job.ScanJob) error {
	args := s.Called(scanJob)
	return args.Error(0)
}

func (s *Store) Get(scanJobID string) (*job.ScanJob, error) {
	args := s.Called(scanJobID)
	return args.Get(0).(*job.ScanJob), args.Error(1)
}

func (s *Store) UpdateStatus(scanJobID string, newStatus job.ScanJobStatus, error ...string) error {
	args := s.Called(scanJobID, newStatus, error)
	return args.Error(0)
}

func (s *Store) UpdateReport(scanJobID string, report harbor.ScanReport) error {
	args := s.Called(scanJobID, report)
	return args.Error(0)
}
