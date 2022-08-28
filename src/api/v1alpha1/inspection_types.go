// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package v1alpha1

import (
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	// CompleteCondition indicates the inspector is completed.
	CompleteCondition = "Completed"
	// FailedCondition indicates the inspector is failed.
	FailedCondition = "Failed"
	// ScheduledTimeAnnotation is the annotation key for recording the scheduling time of the inspector.
	ScheduledTimeAnnotation = "scheduled.time"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// InspectionSpec defines the desired state of Inspection
type InspectionSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Foo is an example field of Inspection. Edit inspection_types.go to remove/update
	Foo string `json:"foo,omitempty"`
}

// InspectionStatus defines the observed state of Inspection
type InspectionStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Conditions of inspector.
	Conditions []*metav1.Condition `json:"conditions"`
}

// IsActive checks whether the inspector is active or not.
// Active means not completed/failed.
func (is *InspectionStatus) IsActive() bool {
	for _, c := range is.Conditions {
		if (c.Type == CompleteCondition || c.Type == FailedCondition) &&
			c.Status == metav1.ConditionTrue {
			return false
		}
	}

	return true
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:resource:scope=Cluster

// Inspection is the Schema for the inspections API
type Inspection struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   InspectionSpec   `json:"spec,omitempty"`
	Status InspectionStatus `json:"status,omitempty"`
}

// ScheduledTime of the inspector.
func (i *Inspection) ScheduledTime() (*time.Time, error) {
	t, ok := i.Annotations[ScheduledTimeAnnotation]
	if !ok {
		return nil, nil
	}

	timeParsed, err := time.Parse(time.RFC3339, t)
	if err != nil {
		return nil, err
	}
	return &timeParsed, nil
}

//+kubebuilder:object:root=true

// InspectionList contains a list of Inspection
type InspectionList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Inspection `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Inspection{}, &InspectionList{})
}
