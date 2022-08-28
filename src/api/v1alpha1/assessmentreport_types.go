// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package v1alpha1

import (
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.
const (
	// OwnerReferenceAnnotation is the annotation key for marking the creation timestamp
	OwnerReferenceAnnotation = "goharbor.io/inspection-policy"
	// CreationTimestampAnnotation is the annotation key for linking owner reference.
	CreationTimestampAnnotation = "goharbor.io/creation-timestamp"
)

const (
	// EnforcementStatusApplied represents the enforcement status 'applied'.
	EnforcementStatusApplied = "applied"
	// EnforcementStatusFailed represents the enforcement status 'failed'.
	EnforcementStatusFailed = "failed"
	// EnforcementStatusDirty represents the enforcement status 'dirty'.
	EnforcementStatusDirty = "Dirty"
)

// AssessmentReportSpec defines the desired state of AssessmentReport
type AssessmentReportSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// InspectionConfiguration refers tp the inspection configuration defined in the InspectionPolicy.
	InspectionConfiguration InspectionConfiguration `json:"inspectionConfiguration"`
	// Assessments are the assessment results.
	NamespaceAssessments []*NamespaceAssessment `json:"namespaceAssessments"`
}

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
	Workload Workload `json:"workload"`
	// Indicates if all the compliance checks are passed.
	Passed bool `json:"passed"`
	// Keep all the failures of the assessment when passed is false.
	// +kubebuilder:validation:Optional
	Failures []*AssessmentFailure `json:"failures,omitempty"`
	// ActionEnforcements indicates what actions are enforced?
	// Only when passed failed and actions are defined in the inspection policy.
	// +kubebuilder:validation:Optional
	ActionEnforcements []*FollowupActionEnforcement `json:"actionEnforcements,omitempty"`
}

// AssessmentFailure defines failures of the assessment.
type AssessmentFailure struct {
	// For which compliance baseline?
	// If no compliance baseline specified, that means other failure happened before doing data assessment.
	// +kubebuilder:validation:Optional
	Baseline *ComplianceBaseline `json:"baseline"`
	// For which container (image)?
	// +kubebuilder:validation:Required
	Container Container `json:"container"`
	// What error occurred?
	// +kubebuilder:validation:Required
	AssessmentError AssessmentError `json:"assessmentError"`
}

// FollowupActionEnforcement indicates what followup actions defined in the inspection configuration are applied.
type FollowupActionEnforcement struct {
	Action FollowupAction    `json:"action"`
	Result EnforcementResult `json:"result"`
}

// EnforcementResult keeps the result of policy enforcement.
type EnforcementResult struct {
	// +kubebuilder:validation:Enum:=applied;failed;dirty
	Status string `json:"status"`
	// +kubebuilder:validation:Optional
	Error *string `json:"error,omitempty"`
}

// AssessmentError defines the error of assessment.
type AssessmentError struct {
	// +kubebuilder:validation:Optional
	Code uint32 `json:"code,omitempty"`
	// +kubebuilder:validation:Required
	Error string `json:"error"`
	// +kubebuilder:validation:Optional
	Cause string `json:"cause,omitempty"`
}

// AssessmentReportStatus defines the observed state of AssessmentReport
type AssessmentReportStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status

// AssessmentReport is the Schema for the assessmentreports API
type AssessmentReport struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AssessmentReportSpec   `json:"spec,omitempty"`
	Status AssessmentReportStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// AssessmentReportList contains a list of AssessmentReport
type AssessmentReportList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []AssessmentReport `json:"items"`
}

func init() {
	SchemeBuilder.Register(&AssessmentReport{}, &AssessmentReportList{})
}
