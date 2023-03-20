// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package providers

import (
	"context"

	harborclient "github.com/goharbor/go-client/pkg/harbor"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/cache"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/providers/harbor"
	v1 "k8s.io/api/core/v1"
	k8client "sigs.k8s.io/controller-runtime/pkg/client"
)

// NewProvider news a Provider based on the provided configurations.
// This is a root factory method for creating new provider.
func NewProvider(ctx context.Context, kclient k8client.Client, setting *v1alpha1.Setting) (Adapter, error) {
	switch setting.Spec.DataSource.Provider {
	case v1alpha1.ProviderHarbor:
		return NewHarborAdapter(ctx, kclient, setting)
	default:
		return nil, errors.Errorf("not implemented: adapter %s", setting.Spec.DataSource.Provider)
	}
}

// NewHarborAdapter constructs the harbor adapter.
func NewHarborAdapter(ctx context.Context, kclient k8client.Client, setting *v1alpha1.Setting) (Adapter, error) {
	config := harborclient.ClientSetConfig{
		URL:      setting.Spec.DataSource.Endpoint,
		Insecure: setting.Spec.DataSource.SkipTLSVerify,
	}
	// check credential
	if cred := setting.Spec.DataSource.CredentialRef; cred != nil {
		sec := &v1.Secret{}
		if err := kclient.Get(ctx, k8client.ObjectKey{Namespace: cred.Namespace, Name: cred.Name}, sec); err != nil {
			return nil, errors.Errorf("get secret '%s/%s' error: %v", cred.Namespace, cred.Name, err)
		}

		config.Username = string(sec.Data[v1alpha1.ProviderAccessKey])
		config.Password = string(sec.Data[v1alpha1.ProviderAccessSecret])
	}

	ap := &harbor.Adapter{}
	ap.WithK8sClient(kclient)

	cs, err := harborclient.NewClientSet(&config)
	if err != nil {
		return nil, errors.Wrap(err, "generate harbor client error")
	}
	ap.WithClient(cs)

	// Init cache client
	if setting.Spec.Cache != nil {
		cc, err := cache.GetClient(setting.Spec.Cache)
		if err != nil {
			return nil, errors.Wrap(err, "get cache client")
		}

		ap.WithCache(cc)
	}
	ap.WithClientConfig(config)
	return ap, nil
}
