// Package types
// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package pkg

import (
	"github.com/aquasecurity/kube-bench/check"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/assets/workload"
	wl "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/assets/workload"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/api/v1alpha1"
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
	Workload wl.Workload `json:"workload"`
	// Indicates if all the compliance checks are passed.
	Passed bool `json:"passed"`
	// Keep all the failures of the assessment when passed is false.
	Failures []*AssessmentFailure `json:"failures,omitempty"`
	// ActionEnforcements indicates what actions are enforced?
	// Only when passed failed and actions are defined in the inspection policy.
}

// AssessmentFailure defines failures of the assessment.
type AssessmentFailure struct {
	// The failure is based on which baseline
	Baseline v1alpha1.ComplianceBaseline
	// For which container (image)?
	Container workload.Container `json:"container"`
	// What error occurred?
	AssessmentError AssessmentError `json:"assessmentError"`
}

// AssessmentError defines the error of assessment.
type AssessmentError struct {
	Code  uint32 `json:"code,omitempty"`
	Error string `json:"error"`
	Cause string `json:"cause,omitempty"`
}

// AssessmentReport struct definition
type AssessmentReport struct {
	TimeStamp            string                 `json:"timeStamp"`
	DocID                string                 `json:"docID"`
	NamespaceAssessments []*NamespaceAssessment `json:"namespaceAssessments"`
}

type CISReport struct {
	check.Controls
	CreateTimestamp string `json:"createTime"`
	NodeName        string `json:"nodeName"`
	DocID           string `json:"docID"`
}

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
