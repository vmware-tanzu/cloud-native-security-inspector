// Package workload
// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package workload

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/trivy"
	"time"

	corev1 "k8s.io/api/core/v1"
)

const (
	// Deployment represents the Deployment workload.
	Deployment = "Deployment"
	// ReplicaSet represents the ReplicaSet workload.
	ReplicaSet = "ReplicaSet"
	// StatefulSet represents the StatefulSet workload.
	StatefulSet = "StatefulSet"
	// DaemonSet represents the DaemonSet workload.
	DaemonSet = "DaemonSet"
	// CronJob represents the CronJob workload.
	CronJob = "CronJob"
	// Job represents the Job workload.
	Job = "Job"
)

// AllWorkloads ...
var AllWorkloads = []string{
	Deployment,
	ReplicaSet,
	StatefulSet,
	DaemonSet,
	CronJob,
	Job,
}

// Workload is the kubernetes workload, including:
// Deployment,ReplicaSet,StatefulSet,DaemonSet,CronJob and Job.
// The workload is described with the following structure:
// workload -> pod -> containers (+images)
// For the kubernetes native resources, use ObjectReference to refer.
type Workload struct {
	// For pure Pod, no object reference.
	corev1.ObjectReference `json:"metadata"`
	// Pods of this workload.
	Pods []*Pod `json:"pods"`
}

// Pod for representing kubernetes Pod.
type Pod struct {
	corev1.ObjectReference `json:"metadata"`
	// Containers of the pod.
	Containers []*Container `json:"containers"`
}

// Container for representing kubernetes Container.
type Container struct {
	// Name of the container.
	Name string `json:"name"`
	// ID of the container.
	ID string `json:"id"`
	// Image of the container.
	Image string `json:"image"`
	// ImageID of the container.
	ImageID string `json:"imageID"`
	// IsInit indicate if the container is an init container.
	IsInit bool `json:"isInit"`
	// VacProductMeta
	VacAssessment *VacProductInfo `json:"vacAssessment,omitempty"`
	// Info from Trivy Scanner
	TrivyReport *trivy.CNSIReport `json:"trivyReport,omitempty"`
}

// NonSupportPolicy VMWare Application Catalog Product's non-support policy information.
type NonSupportPolicy struct {
	// Human-readable name for the non-support policy.
	Name string `json:"name"`
	// Sentence explaining why the non-support policy is set.
	Reason string `json:"reason"`
}

// DeprecationPolicy VMWare Application Catalog Product's deprecation policy information.
type DeprecationPolicy struct {
	// Effective date since which the deprecation policy will take effect.
	DeprecationDate string `json:"deprecation_date"`
	// Period of time in days **after** the deprecation date in which the support for the catalog item, might be reduced instead of being completely removed.
	GracePeriodDays *int32 `json:"gracePeriodDays,omitempty"`
	// Sentence explaining why the deprecation policy is set.
	Reason *string `json:"reason,omitempty"`
	// Sentence pointing to alternatives to the deprecated resource.
	Alternative *string `json:"alternative,omitempty"`
}

// VacProductInfo for representing VacProductInfo for an image
type VacProductInfo struct {
	Trusted bool `json:"trusted"`
	// Product name from VMWare Application Catalog
	Name *string `json:"name,omitempty"`
	// Product branch from VMWare Application Catalog
	Branch *string `json:"branch,omitempty"`
	// Product version from VMWare Application Catalog
	Version *string `json:"version,omitempty"`
	// Product revision from VMWare Application Catalog
	Revision *string `json:"revision,omitempty"`
	// The date-time which the product was released at
	ReleasedAt *time.Time `json:"releasedAt,omitempty"`
	// Last release version of product
	LastVersionReleased *string `json:"lastVersionReleased,omitempty"`
	// Newer branches available for product
	NewerBranchesAvailable []string           `json:"newerBranchesAvailable,omitempty"`
	DeprecationPolicy      *DeprecationPolicy `json:"deprecationPolicy,omitempty"`
	NonsupportPolicy       *NonSupportPolicy  `json:"nonSupportPolicy,omitempty"`
	// The status of the product in the catalog. Available values are DRAFT, ACTIVE, SCHEDULED_DEPRECATION, DEPRECATION_GRACE_PERIOD, DEPRECATED, NON_SUPPORTED
	Status *string `json:"status,omitempty"`
}
