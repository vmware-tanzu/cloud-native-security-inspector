// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package v1alpha1

import (
	corev1 "k8s.io/api/core/v1"
)

const (
	// WorkloadKindDeployment represents the Deployment workload.
	WorkloadKindDeployment = "Deployment"
	// WorkloadKindReplicaSet represents the ReplicaSet workload.
	WorkloadKindReplicaSet = "ReplicaSet"
	// WorkloadKindStatefulSet represents the StatefulSet workload.
	WorkloadKindStatefulSet = "StatefulSet"
	// WorkloadKindDaemonSet represents the DaemonSet workload.
	WorkloadKindDaemonSet = "DaemonSet"
	// WorkloadKindCronJob represents the CronJob workload.
	WorkloadKindCronJob = "CronJob"
	// WorkloadKindJob represents the Job workload.
	WorkloadKindJob = "Job"
)

// AllWorkloads ...
var AllWorkloads = []string{
	WorkloadKindDeployment,
	WorkloadKindReplicaSet,
	WorkloadKindStatefulSet,
	WorkloadKindDaemonSet,
	WorkloadKindCronJob,
	WorkloadKindJob,
}

// Workload is the kubernetes workload, including:
// Deployment,ReplicaSet,StatefulSet,DaemonSet,CronJob and Job.
// The workload is described with the following structure:
// workload -> pod -> containers (+images)
// For the kubernetes native resources, use ObjectReference to refer.
type Workload struct {
	// For pure Pod, no object reference.
	corev1.ObjectReference `json:"metadata"`
	// Replicas of this workload.
	Replicas int32 `json:"replicas"`
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
}
