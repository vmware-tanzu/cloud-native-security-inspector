// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package policy

import (
	"context"
	rcworkload "github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/assets/workload"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/policy/enforcement"
)

// Enforcer to enforce policy.
type Enforcer interface {
	// Enforce policy to the specified workload with options.
	Enforce(ctx context.Context, workload *rcworkload.Workload, option ...enforcement.Option) error
	// Revoke policy from the specified workload.
	Revoke(ctx context.Context, workload *rcworkload.Workload) error
	// HasBeenEnforced checks if the workload is managed by the policy.
	HasBeenEnforced(ctx context.Context, workload *rcworkload.Workload) (bool, error)
}
