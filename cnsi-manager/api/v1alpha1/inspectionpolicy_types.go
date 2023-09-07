// Package v1alpha1
// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package v1alpha1

import (
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	// PolicyStandby describes the standby status of the policy.
	PolicyStandby = "Standby"
	// PolicySuspend describes the suspend status of the policy.
	PolicySuspend = "Suspend"
)

const (
	// CronjobInpsection describes the Inspection type of cronjob.
	CronjobInpsection = "Inpection"
	// DaemonSetKubebench describes the Kubebench type of the cronjob.
	DaemonSetKubebench = "Kubebench"
	// CronjobRisk describes the Risk type of the cronjob.
	CronjobRisk = "Risk"
	// CronjobWorkloadscanner describes the Workloadscanner type of the cronjob
	CronjobWorkloadscanner = "Workloadscanner"
	// CronjobPkgLoadScaner describes the PkgLoadScanner type of the cronjob.
	CronjobPkgLoadScanner = "PkgLoadScanner"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// InspectionDimension defines the dimension of the inspector.
type InspectionDimension string

// ConcurrencyRule defines the currency handling strategy.
type ConcurrencyRule string

// NameReference is a reference of the resource name.
type NameReference string

// Credential is defined to keep access key and secret.
type Credential struct {
	AccessKey    string `json:"accessKey"`
	AccessSecret string `json:"accessSecret"`
}

// DataProvider defines the provider of the security data used to do inspector.
type DataProvider struct {
	// Identity of the provider.
	// +kubebuilder:validation:Enum:=Harbor
	Provider string `json:"provider"`
	// Endpoint for accessing.
	// +kubebuilder:validation:Required
	Endpoint string `json:"endpoint"`
	// Credential for providing access key and secret.
	// Empty credential is acceptable if the endpoint is public.
	// +kubebuilder:validation:Optional
	Credential *Credential `json:"credential,omitempty"`
	// Cache configuration if existing.
	// +kubebuilder:validation:Optional
	Cache *Cache `json:"cache,omitempty"`
	// Connection settings.
	Connection Connection `json:"connection"`
}

// Connection settings for connecting to the provider with HTTP.
type Connection struct {
	// Insecure HTTP client will be used to connect to the provider.
	// +kubebuilder:default:=true
	Insecure bool `json:"insecure"`
}

// FollowupAction defines what actions should be applied when security expectations are matched.
type FollowupAction struct {
	// Kind of action.
	// +kubebuilder:validation:Enum:=forbid_vulnerable_deployment;quarantine_vulnerable_workload;alert
	Kind string `json:"kind"`
	// Ignore applying actions to the workloads with the specified labels.
	// +kubebuilder:validation:Optional
	Ignore *metav1.LabelSelector `json:"ignore,omitempty"`
	// Settings of the action.
	// +kubebuilder:validation:Optional
	Settings map[string]string `json:"settings,omitempty"`
}

// ComplianceBaseline defines the expecting compliance baseline.
type ComplianceBaseline struct {
	// Kind of inspector.
	// +kubebuilder:validation:Enum:=vulnerability;malware;misconfiguration;license;BOM
	Kind InspectionDimension `json:"kind"`
	// Version of data scheme used for the compliance check.
	// +kubebuilder:validation:Required
	Version string `json:"version"`
	// Scheme of data.
	// +kubebuilder:validation:Required
	Scheme string `json:"scheme"`
	// Baseline for the compliance of this kind.
	// +kubebuilder:validation:Required
	Baseline string `json:"baseline"`
}

// InspectionConfiguration contains the configurations of the inspection.
type InspectionConfiguration struct {
	// Actions of protection.
	// +kubebuilder:validation:Optional
	Actions []*FollowupAction `json:"actions"`
	// Baselines of cluster compliance.
	// +kubebuilder:validation:Optional
	Baselines []*ComplianceBaseline `json:"baselines"`
	// NamespaceSelector provides a way to select the specified namespaces.
	// +kubebuilder:validation:Optional
	NamespaceSelector *metav1.LabelSelector `json:"namespaceSelector,omitempty"`
	// WorkloadSelector provides a way to select the specified workloads.
	// +kubebuilder:validation:Optional
	WorkloadSelector *metav1.LabelSelector `json:"workloadSelector,omitempty"`
}

type ExportConfig struct {
	// +kubebuilder:validation:Optional
	OpenSearch OpensearchOutputConfig `json:"openSearch,omitempty"`
	// +kubebuilder:validation:Optional
	Governor GovernorOutputConfig `json:"governor,omitempty"`
	// Extend this struct for more consumers
}

// GovernorOutputConfig contains policies for governor to send report
type GovernorOutputConfig struct {
	// Unique identifier of the cluster
	// +kubebuilder:validation:Optional
	ClusterID string `json:"clusterId"`
	// Api url to send telemetry data
	// +kubebuilder:validation:Optional
	URL string `json:"url"`
	// Secret name where CSP api token is stored in cnsi-system namespace
	// +kubebuilder:validation:Optional
	CspSecretName string `json:"cspSecretName"`
}

type OpensearchOutputConfig struct {
	HostPort string `json:"hostport"`
	// +kubebuilder:validation:Optional
	Index     string `json:"index,omitempty"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	CheckCert bool   `json:"checkCert"`
	MutualTLS bool   `json:"mutualTLS"`
}

// ReportData defines the protocol between scanners and exporters
type ReportData struct {
	// Source indicates the report is from which source
	Source string `json:"source"`
	// Config indicates the consumer configurations
	ExportConfig ExportConfig `json:"exportConfig"`
	// Payload is the actual report content
	Payload string `json:"payload"`
}

// Strategy of inspector.
type Strategy struct {
	// HistoryLimit limits the max number of the completed inspections.
	// +kubebuilder:default:=25
	// +kubebuilder:validation:Optional
	HistoryLimit *int32 `json:"historyLimit"`
	// Suspend the subsequent inspections temporarily.
	// +kubebuilder:validation:Optional
	Suspend *bool `json:"suspend,omitempty"`
	// ConcurrencyRule indicates how to handle the overlapped inspector processes.
	// +kubebuilder:validation:Enum:=Allow;Forbid;Replace
	// +kubebuilder:validation:Optional
	// +kubebuilder:default:=Forbid
	ConcurrencyRule ConcurrencyRule `json:"concurrencyRule"`
}

// Inspector contains the image configuration of the inspector.
type Inspector struct {
	// +kubebuilder:validation:Optional
	ExportConfig ExportConfig `json:"exportConfig,omitempty"`
	// Image of the inspector.
	// +kubebuilder:validation:Optional
	Image string `json:"image"`
	// Image of the kubebench.
	// +kubebuilder:validation:Optional
	KubebenchImage string `json:"kubebenchImage"`
	// Image of the risk.
	// +kubebuilder:validation:Optional
	RiskImage string `json:"riskImage"`
	// Image of the pkgloadscanner.
	// +kubebuilder:validation:Optional
	PkgLoadScannerImage string `json:"pkgLoadScannerImage"`
	// Image of the workloadscanner.
	// +kubebuilder:validation:Optional
	WorkloadScannerImage string `json:"workloadscannerImage"`
	// Image pull policy.
	// +kubebuilder:default:=IfNotPresent
	// +kubebuilder:validation:Optional
	ImagePullPolicy corev1.PullPolicy `json:"imagePullPolicy"`
	// Image pull secrets.
	// +kubebuilder:validation:Optional
	ImagePullSecrets []corev1.LocalObjectReference `json:"imagePullSecrets,omitempty"`
}

// InspectionPolicySpec defines the desired state of InspectionPolicy
type InspectionPolicySpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	// DataSource is the data source definitions.
	// +kubebuilder:validation:Optional
	SettingsName string `json:"settingsName"`

	// +kubebuilder:validation:Optional
	VacAssessmentEnabled bool `json:"vacAssessmentEnabled"`

	// Enabled defines whether this inspection policy disable or enable, default is enabled.
	// +kubebuilder:validation:Optional
	Enabled bool `json:"enabled,omitempty"`

	// WorkNamespace specify the namespace for creating the underlying inspection resources.
	// If it is not specified, a new namespace with the same name of this policy will be created.
	// If the namespace with the name of this policy is existing and it's not created by the controller,
	// conflict error will occur.
	// +kubebuilder:validation:Optional
	WorkNamespace *string `json:"workNamespace"`

	// Schedule of the inspector.
	// Cron format. Reference: https://en.wikipedia.org/wiki/Cron
	// +kubebuilder:validation:Required
	// +kubebuilder:validation:Pattern:=`(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})`
	Schedule string `json:"schedule"`

	// Inspection defines the configurations of the inspector.
	Inspection InspectionConfiguration `json:"inspection"`

	// Strategy of the inspector.
	// +kubebuilder:default:={suspend: false}
	// +kubebuilder:validation:Optional
	Strategy Strategy `json:"strategy"`

	// Inspector (image) for doing the inspection.
	// +kubebuilder:validation:Optional
	Inspector *Inspector `json:"inspector,omitempty"`
}

// InspectionPolicyStatus defines the observed state of InspectionPolicy
type InspectionPolicyStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// InspectionExecutor of this policy. It is always an object reference to the underlying cronjob.
	// +kubebuilder:validation:Optional
	InspectionExecutor *corev1.ObjectReference `json:"inspectionExecutor"`

	// KubebenchExecutor of this policy. It is always an object reference to the underlying cronjob.
	// +kubebuilder:validation:Optional
	KubebenchExecutor []*corev1.ObjectReference `json:"kubebenchExecutor"`

	// RiskExecutor of this policy. It is always an object reference to the underlying cronjob.
	// +kubebuilder:validation:Optional
	RiskExecutor *corev1.ObjectReference `json:"riskExecutor"`

	// PkgLoadScannerExecutor of this policy. It is always an object reference to the underlying cronjob.
	// +kubebuilder:validation:Optional
	PkgLoadScannerExecutor *corev1.ObjectReference `json:"pkgLoadScannerExecutor"`

	// WorkloadscannerExecutor of this policy. It is always an object reference to the underlying cronjob.
	// +kubebuilder:validation:Optional
	WorkloadScannerExecutor *corev1.ObjectReference `json:"workloadScannerExecutor"`

	// Status of the policy.
	// Pending, Standby, Suspend.
	Status string `json:"status"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:resource:scope=Cluster
//+kubebuilder:printcolumn:name="Status",type=string,JSONPath=`.status.status`,priority=50
//+kubebuilder:printcolumn:name="Schedule",type=string,JSONPath=`.spec.schedule`,priority=100

// InspectionPolicy is the Schema for the inspectionpolicies API
type InspectionPolicy struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   InspectionPolicySpec   `json:"spec,omitempty"`
	Status InspectionPolicyStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// InspectionPolicyList contains a list of InspectionPolicy
type InspectionPolicyList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []InspectionPolicy `json:"items"`
}

func init() {
	SchemeBuilder.Register(&InspectionPolicy{}, &InspectionPolicyList{})
}
