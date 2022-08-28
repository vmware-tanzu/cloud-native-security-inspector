// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ConditionType is a camel-cased condition type.
type ConditionType string

// ConditionStatus is the status of condition.
type ConditionStatus string

const (
	// ConditionStatusTrue represents the condition status is True.
	ConditionStatusTrue ConditionStatus = "True"
	// ConditionStatusFalse represents the condition status is False.
	ConditionStatusFalse ConditionStatus = "False"
	// ConditionStatusUnknown represents the condition status is Unknown.
	ConditionStatusUnknown ConditionStatus = "Unknown"
)

// Conditions is the schema for collected conditions.
type Conditions []Condition

// Condition is the schema for condition.
type Condition struct {
	// Type of condition.
	// +kubebuilder:validation:Required
	Type ConditionType `json:"type"`
	// Status of condition, one of True, False, Unknown
	// +kubebuilder:validation:Required
	Status ConditionStatus `json:"status"`
	// LastTransitionTime is the last time the condition transitioned from one
	// status to another.
	// +kubebuilder:validation:Optional
	LastTransitionTime *metav1.Time `json:"lastTransitionTime,omitempty"`
	// Reason is the reason for condition's last transition.
	// +kubebuilder:validation:Optional
	Reason string `json:"reason,omitempty"`
	// Message is a human readable message indicating details about the
	// transition.
	// +kubebuilder:validation:Optional
	Message string `json:"message,omitempty"`
}

// IsTrue checks if the condition status is True.
func (c *Condition) IsTrue() bool {
	if c == nil {
		return false
	}

	return c.Status == ConditionStatusTrue
}

// IsFalse checks if the condition status if False.
func (c *Condition) IsFalse() bool {
	if c == nil {
		return false
	}

	return c.Status == ConditionStatusFalse
}

// IsUnknown checks if the condition status is Unknown.
func (c *Condition) IsUnknown() bool {
	if c == nil {
		return false
	}

	return c.Status == ConditionStatusUnknown
}
