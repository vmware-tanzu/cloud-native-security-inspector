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
	// CronjobKubebench describes the Kubebench type of the cronjob.
	CronjobKubebench = "Kubebench"
	// CronjobRisk describes the Risk type of the cronjob.
	CronjobRisk = "Risk"
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

// Assessment report.
type Assessment struct {
	// Generate indicates whether generate the assessment report or not.
	// +kubebuilder:default:=true
	Generate bool `json:"generate"`
	// Format of the assessment report data.
	// +kubebuilder:validation:Enum:=JSON;YAML
	// +kubebuilder:default:=YAML
	Format string `json:"format"`
	// Live time of the generated report.
	// Unit is second.
	// +kubebuilder:default:=86400
	LiveTime int64 `json:"liveTime"`
	// Indicate whether the assessment reports are managed by the policy.
	// If it is set to true, then the assessment report is owned by the policy.
	// +kubebuilder:default:=false
	ManagedBy bool `json:"managedBy"`
	// Indicate whether to store the reports to elasticsearch
	// +kubebuilder:default:=false
	ElasticSearchEnabled bool `json:"elasticSearchEnabled"`
	// ElasticSearch endpoint
	// +kubebuilder:validation:Optional
	ElasticSearchAddr string `json:"elasticSearchAddr"`
	// ElasticSearch username for the client
	// +kubebuilder:validation:Optional
	ElasticSearchUser string `json:"elasticSearchUser"`
	// ElasticSearch password for the client
	// +kubebuilder:validation:Optional
	ElasticSearchPasswd string `json:"elasticSearchPasswd"`
	// ElasticSearch certificate for the client
	// +kubebuilder:validation:Optional
	ElasticSearchCert string `json:"elasticSearchCert"`
	// Indicate whether to store the reports to opensearch
	// +kubebuilder:default:=false
	OpenSearchEnabled bool `json:"openSearchEnabled"`
	// ElasticSearch endpoint
	// +kubebuilder:validation:Optional
	OpenSearchAddr string `json:"openSearchAddr"`
	// ElasticSearch username for the client
	// +kubebuilder:validation:Optional
	OpenSearchUser string `json:"openSearchUser"`
	// ElasticSearch password for the client
	// +kubebuilder:validation:Optional
	OpenSearchPasswd string `json:"openSearchPasswd"`
	// ElasticSearch certificate for the client
	// +kubebuilder:validation:Optional
	OpenSearchCert string `json:"openSearchCert"`
	// Indicate whether to config of governor
	// +kubebuilder:validation:Optional
	Governor Governor `json:"governor"`
}

// Governor contains policies for governor to send report
type Governor struct {
	// Indicate whether to send the reports to governor
	// +kubebuilder:default:=false
	Enabled bool `json:"enabled"`
	// Unique identifier of the cluster
	// +kubebuilder:validation:Optional
	ClusterID string `json:"clusterId"`
	// Api url to send telemetry data
	// +kubebuilder:validation:Optional
	URL string `json:"url"`
	// Api token for user authentication
	// +kubebuilder:validation:Optional
	APIToken string `json:"apiToken"`
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
	// DataProvider is the data provider.
	//DataProvider DataProvider `json:"dataProvider"`
	// Assessment is the assessment report.
	Assessment Assessment `json:"assessment"`
	// Actions of protection.
	// +kubebuilder:validation:Optional
	Actions []*FollowupAction `json:"actions"`
	// Baselines of cluster compliance.
	// +kubebuilder:validation:MinItems:=1
	Baselines []*ComplianceBaseline `json:"baselines"`
	// NamespaceSelector provides a way to select the specified namespaces.
	// +kubebuilder:validation:Optional
	NamespaceSelector *metav1.LabelSelector `json:"namespaceSelector,omitempty"`
	// WorkloadSelector provides a way to select the specified workloads.
	// +kubebuilder:validation:Optional
	WorkloadSelector *metav1.LabelSelector `json:"workloadSelector,omitempty"`
}

// Strategy of inspector.
type Strategy struct {
	// HistoryLimit limits the max number of the completed inspections.
	// +kubebuilder:default:=25
	HistoryLimit *int32 `json:"historyLimit"`
	// Suspend the subsequent inspections temporarily.
	// +kubebuilder:validation:Optional
	Suspend *bool `json:"suspend,omitempty"`
	// ConcurrencyRule indicates how to handle the overlapped inspector processes.
	// +kubebuilder:validation:Enum:=Allow;Forbid;Replace
	// +kubebuilder:default:=Forbid
	ConcurrencyRule ConcurrencyRule `json:"concurrencyRule"`
}

// Inspector contains the image configuration of the inspector.
type Inspector struct {
	// Image of the inspector.
	// +kubebuilder:validation:Optional
	Image string `json:"image"`
	// Image of the kubebench.
	// +kubebuilder:validation:Optional
	KubebenchImage string `json:"kubebenchImage"`
	// Image of the risk.
	// +kubebuilder:validation:Optional
	RiskImage string `json:"riskImage"`
	// Image pull policy.
	// +kubebuilder:default:=IfNotPresent
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
	// +kubebuilder:validation:Required
	SettingsName string `json:"settingsName"`

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
