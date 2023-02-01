// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0

package inspectionpolicy

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const GroupName = "goharbor.goharbor.io"
const GroupVersion = "v1alpha1"

var SchemeGroupVersion = schema.GroupVersion{Group: GroupName, Version: GroupVersion}

var (
	SchemeBuilder = runtime.NewSchemeBuilder(addKnownTypes)
	AddToScheme   = SchemeBuilder.AddToScheme
)

func addKnownTypes(scheme *runtime.Scheme) error {
	scheme.AddKnownTypes(SchemeGroupVersion,
		&v1alpha1.InspectionPolicy{},
	)

	metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
	return nil
}
