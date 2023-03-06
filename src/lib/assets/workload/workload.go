// Package workload
// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package workload

import (
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
}
