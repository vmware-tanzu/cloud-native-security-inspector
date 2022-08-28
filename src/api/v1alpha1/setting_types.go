// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package v1alpha1

import (
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	// ProviderAccessKey is the key of provider access key.
	ProviderAccessKey = "accessKey"
	// ProviderAccessSecret is the key of provider access secret.
	ProviderAccessSecret = "accessSecret"
)

// ProviderType defines the provider common type.
type ProviderType string

func (p ProviderType) String() string {
	return string(p)
}

const (
	// ProviderHarbor represents harbor provider.
	ProviderHarbor ProviderType = "Harbor"
)

// SettingStatus defines the setting health status type.
type SettingStatusType string

const (
	// SettingStatusUnknown defines the unknown status.
	SettingStatusUnknown SettingStatusType = "Unknown"
	// SettingStatusHealthy defines the healthy status.
	SettingStatusHealthy SettingStatusType = "Healthy"
	// SettingStatusUnhealthy defines the unhealthy status.
	SettingStatusUnhealthy SettingStatusType = "Unhealthy"
)

const (
	// ConditionTypeDataSourceReady is the condition type of data source ready.
	ConditionTypeDataSourceReady ConditionType = "DataSourceReady"
	// ConditionTypeKnownRegistryRegistered is the condition type of known registry registered.
	ConditionTypeKnownRegistryRegistered ConditionType = "KnownRegistryRegistered"
	// ConditionTypeApplyConfigReady is the condition type of apply config ready.
	ConditionTypeApplyConfigReady ConditionType = "ApplyConfigReady"
)

// Cache defines cache configurations for caching data from the provider.
type Cache struct {
	// Kind of the cache.
	// +kubebuilder:validation:Enum:=Redis
	Kind string `json:"kind"`
	// Address of the cache. e.g: redis://xxx.com.
	// +kubebuilder:validation:Required
	Address string `json:"address"`
	// CredentialRef for providing access credential.
	// Empty credentialRef is acceptable if the cache service is public.
	// +kubebuilder:validation:Optional
	CredentialRef *v1.ObjectReference `json:"credentialRef,omitempty"`
	// Database index for connecting to.
	// +kubebuilder:validation:Optional
	Database *int `json:"database,omitempty"`
	// Settings of cache.
	Settings CacheSettings `json:"settings"`
}

// CacheSettings defines settings for the cache.
type CacheSettings struct {
	// LivingTime (seconds) specifies the living time of the cache data.
	// After cache data longer than the `LivingTime`, the cache data must be refreshed again.
	// +kubebuilder:default:=3600
	LivingTime int64 `json:"livingTime"`
	// SkipTLSVerify indicates whether skip the TLS verification. Only active when 'rediss' scheme is configured.
	// +kubebuilder:validation:Optional
	SkipTLSVerify *bool `json:"skipTLSVerify,omitempty"`
}

// Registry defines the common spec of registry.
type Registry struct {
	// Name is the registry name.
	// +kubebuilder:validation:Required
	Name string `json:"name"`
	// Endpoint defines the endpoint of the registry.
	// +kubebuilder:validation:Required
	Endpoint string `json:"endpoint"`
	// CredentialRef defines the authorization info for registry,
	// the value is a reference to secret.
	// +kubebuilder:validation:Optional
	CredentialRef *v1.ObjectReference `json:"credentialRef,omitempty"`
	// TLSVerify defines whether need to verify tls cert.
	// +kubebuilder:validation:Optional
	SkipTLSVerify bool `json:"skipTLSVerify,omitempty"`
}

// KnownRegistry defines the spec of known registry.
type KnownRegistry struct {
	// Registry inherits common registry spec.
	// +kubebuilder:validation:Required
	Registry `json:",inline"`
	// Provider defines the registry provider type.
	// +kubebuilder:validation:Enum:=ali-acr;artifact-hub;aws-ecr;azure-acr;docker-hub;docker-registry;dtr;github-ghcr;gitlab;google-gcr;harbor;helm-hub;huawei-SWR;jfrog-artifactory;quay;tencent-tcr
	Provider ProviderType `json:"provider"`
}

// DataSource defines the properties of data source.
type DataSource struct {
	// Registry inherits common registry spec.
	// +kubebuilder:validation:Required
	Registry `json:",inline"`
	// Provider defines the registry provider type.
	// +kubebuilder:validation:Enum:=Harbor
	Provider ProviderType `json:"provider"`
	// Disable defines whether this data source disable or enable, default is
	// enable.
	// +kubebuilder:validation:Optional
	Disabled bool `json:"disabled,omitempty"`
	// ScanSchedule defines the scan schedule for the data source.
	// +kubebuilder:validation:Required
	ScanSchedule string `json:"scanSchedule"`
}

// SettingSpec defines the spec of setting.
type SettingSpec struct {
	// KnownRegistries is the registered private registry collections.
	// +kubebuilder:validation:Optional
	KnownRegistries []KnownRegistry `json:"knownRegistries,omitempty"`
	// DataSource is the data source definitions.
	// +kubebuilder:validation:Required
	DataSource DataSource `json:"dataSource,omitempty"`
	// Cache is the cache configurations.
	// +kubebuilder:validation:Optional
	Cache *Cache `json:"cache,omitempty"`
}

// SettingStatus defines the status of setting.
type SettingStatus struct {
	// Status represents the health status of setting.
	// +kubebuilder:validation:Enum:=Unknown;Healthy;Unhealthy
	Status SettingStatusType `json:"status"`
	// Conditions represents the collections of setting condition.
	// +kubebuilder:validation:Optional
	Conditions Conditions `json:"conditions,omitempty"`
}

// GetCondition fetches the condition of the specified type.
func (s *SettingStatus) GetCondition(t ConditionType) *Condition {
	for _, cond := range s.Conditions {
		if cond.Type == t {
			return &cond
		}
	}

	return nil
}

// SetCondition sets condition to status, update when exist and append when not exist.
func (s *SettingStatus) SetCondition(cond *Condition) {
	if cond == nil {
		return
	}

	found := false
	for i, c := range s.Conditions {
		if cond.Type == c.Type {
			found = true
			s.Conditions[i] = *cond
		}
	}

	if !found {
		s.Conditions = append(s.Conditions, *cond)
	}
}

// AggregateStatus aggregates status by conditions.
func (s *SettingStatus) AggregateStatus() *SettingStatus {
	// should have these conditions
	shouldConds := []ConditionType{ConditionTypeDataSourceReady, ConditionTypeKnownRegistryRegistered, ConditionTypeApplyConfigReady}
	healthy := true
	for _, c := range shouldConds {
		cond := s.GetCondition(c)
		if cond != nil && cond.Status == ConditionStatusTrue {
			healthy = healthy && true
		} else {
			healthy = healthy && false
		}
	}

	if healthy {
		s.Status = SettingStatusHealthy
	} else {
		s.Status = SettingStatusUnhealthy
	}

	return s
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:resource:scope=Cluster
//+kubebuilder:printcolumn:name="Endpoint",type=string,JSONPath=`.spec.dataSource.endpoint`
//+kubebuilder:printcolumn:name="Status",type=string,JSONPath=`.status.status`
//+kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// Setting is the Schema for the cnsi related configs.
type Setting struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   SettingSpec   `json:"spec,omitempty"`
	Status SettingStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// SettingList contains a list of Setting.
type SettingList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Setting `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Setting{}, &SettingList{})
}
