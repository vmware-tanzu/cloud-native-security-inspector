// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package providers

import (
	"context"

	harborclient "github.com/goharbor/go-client/pkg/harbor"
	"github.com/pkg/errors"
	"goharbor.io/k8s-security-inspector/api/v1alpha1"
	"goharbor.io/k8s-security-inspector/pkg/data/providers/harbor"
	v1 "k8s.io/api/core/v1"
	k8client "sigs.k8s.io/controller-runtime/pkg/client"
)

// NewProvider news a Provider based on the provided configurations.
// This is a root factory method for creating new provider.
func NewProvider(ctx context.Context, kclient k8client.Client, ds *v1alpha1.DataSource) (Adapter, error) {
	switch ds.Provider {
	case v1alpha1.ProviderHarbor:
		return NewHarborAdapter(ctx, kclient, ds)
	default:
		return nil, errors.Errorf("not implemented: adapter %s", ds.Provider)
	}
}

var _ Adapter = &harbor.Adapter{}

// NewHarborAdapter constructs the harbor adapter.
func NewHarborAdapter(ctx context.Context, kclient k8client.Client, ds *v1alpha1.DataSource) (Adapter, error) {
	config := harborclient.ClientSetConfig{
		URL:      ds.Endpoint,
		Insecure: ds.SkipTLSVerify,
	}
	// check credential
	if cred := ds.CredentialRef; cred != nil {
		sec := &v1.Secret{}
		if err := kclient.Get(ctx, k8client.ObjectKey{Namespace: cred.Namespace, Name: cred.Name}, sec); err != nil {
			return nil, errors.Errorf("get secret '%s/%s' error: %v", cred.Namespace, cred.Name, err)
		}

		config.Username = string(sec.Data[v1alpha1.ProviderAccessKey])
		config.Password = string(sec.Data[v1alpha1.ProviderAccessSecret])
	}

	// TODO cache.

	cs, err := harborclient.NewClientSet(&config)
	if err != nil {
		return nil, errors.Wrap(err, "generate harbor client error")
	}

	ap := &harbor.Adapter{}
	return ap.WithClient(cs).WithK8sClient(kclient), nil
}
