// Package types
// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package types

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/assets/workload"
	v1 "k8s.io/api/core/v1"
)

// NamespaceInfo defines information for each Namespace.
type NamespaceInfo struct {
	// Which namespace?
	Namespace v1.LocalObjectReference `json:"namespace"`
	// Assessments contains results of namespace assessments.
	WorkloadInfos []*WorkloadInfo `json:"workloadInfos"`
}

// WorkloadInfo defines information for each Workload.
type WorkloadInfo struct {
	// For which workload is assessing?
	Workload workload.Workload `json:"workload"`
}

// WorkloadReport struct definition
type WorkloadReport struct {
	NamespaceInfos []*NamespaceInfo `json:"namespaceInfos"`
}
