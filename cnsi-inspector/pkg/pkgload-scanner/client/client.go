package client

import (
	"context"

	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client/v1alpha"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client/v1alpha/api"
)

type PkgInfoClient interface {
	ScanImage(ctx context.Context, imageName string) (scanResult *api.ScanResult, err error)
	Ping(ctx context.Context) (err error)
	WaitForReady(ctx context.Context) (err error)
}

func New(network string, address string) PkgInfoClient {
	return v1alpha.NewClient(network, address)
}
