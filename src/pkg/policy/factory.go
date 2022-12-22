// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package policy

import (
	"fmt"
	"github.com/pkg/errors"

	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/policy/network"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var _ Enforcer = &network.Enforcer{}

// EnforcerOptions defines options for the enforcer.
type EnforcerOptions struct {
	kc     client.Client
	scheme *runtime.Scheme
}

// From options.
func (eo *EnforcerOptions) From(option ...EnforcerOption) {
	for _, op := range option {
		op(eo)
	}
}

// EnforcerOption defines option for the enforcer.
type EnforcerOption func(options *EnforcerOptions)

// UseClient uses the k8s client.
func UseClient(cli client.Client) EnforcerOption {
	return func(options *EnforcerOptions) {
		options.kc = cli
	}
}

// WithScheme sets what scheme will use.
func WithScheme(scheme *runtime.Scheme) EnforcerOption {
	return func(options *EnforcerOptions) {
		options.scheme = scheme
	}
}

// GetEnforcer returns enforcer by name.
// Optional options provided.
func GetEnforcer(name string, option ...EnforcerOption) (Enforcer, error) {
	switch name {
	case network.EnforcerName:
		return NewNetworkPolicyEnforcer(option...)
	default:
		return nil, fmt.Errorf("no enforcer with name %s implemented", name)
	}
}

// NewNetworkPolicyEnforcer is constructor of network policy enforcer.
func NewNetworkPolicyEnforcer(option ...EnforcerOption) (Enforcer, error) {
	options := &EnforcerOptions{}
	options.From(option...)

	// Validate the required options.
	if options.kc == nil {
		return nil, errors.New("missing k8s client")
	}

	if options.scheme == nil {
		return nil, errors.New("missing runtime scheme")
	}

	enforcer := network.New().
		WithScheme(options.scheme).
		UseClient(options.kc)

	return enforcer, nil
}
