package mock

import (
	"github.com/stretchr/testify/mock"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/harbor"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/trivy"
)

type Transformer struct {
	mock.Mock
}

func NewTransformer() *Transformer {
	return &Transformer{}
}

func (t *Transformer) Transform(artifact harbor.Artifact, source []trivy.Vulnerability) harbor.ScanReport {
	args := t.Called(artifact, source)
	return args.Get(0).(harbor.ScanReport)
}
