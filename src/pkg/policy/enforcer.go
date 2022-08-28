// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package policy

import (
	"context"

	"goharbor.io/k8s-security-inspector/api/v1alpha1"
	"goharbor.io/k8s-security-inspector/pkg/policy/enforcement"
)

// Enforcer to enforce policy.
type Enforcer interface {
	// Enforce policy to the specified workload with options.
	Enforce(ctx context.Context, workload *v1alpha1.Workload, option ...enforcement.Option) error
	// Revoke policy from the specified workload.
	Revoke(ctx context.Context, workload *v1alpha1.Workload) error
	// IsManaged checks if the workload is managed by the policy.
	IsManaged(ctx context.Context, workload *v1alpha1.Workload) (bool, error)
}
