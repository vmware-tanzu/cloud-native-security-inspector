// Package types
// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package types

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/assets/workload"
	v1 "k8s.io/api/core/v1"
)

// NamespaceAssessment defines assessment results for each Namespace.
type NamespaceAssessment struct {
	// Which namespace?
	Namespace v1.LocalObjectReference `json:"namespace"`
	// Assessments contains results of namespace assessments.
	WorkloadAssessments []*WorkloadAssessment `json:"workloadAssessments"`
}

// WorkloadAssessment defines assessment results for each Workload.
type WorkloadAssessment struct {
	// For which workload is assessing?
	Workload workload.Workload `json:"workload"`
}

// AssessmentReport struct definition
type AssessmentReport struct {
	NamespaceAssessments []*NamespaceAssessment `json:"namespaceAssessments"`
}
