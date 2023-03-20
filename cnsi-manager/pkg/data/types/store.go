// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package types

import (
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/core"
)

// Store for holding the security data read from the upstream data provider.
type Store interface {
	// Metadata of the data holding by the store.
	Metadata() core.Metadata

	// Validate validates whether the store has proper data of the specified type.
	Validate() error

	// SetError sets the store to the error state.
	// If the previous error exists, error provided here will override the previous one.
	// This will cause Validate() returns non nil error.
	SetError(err error)

	// FillIn fill in store with the provided data.
	// Any error happened here MUST cause Validate() returns non nil error.
	FillIn(artifactID core.ArtifactID, data interface{})

	// ForArtifact indicates data is for which image artifact.
	ForArtifact() core.ArtifactID

	// Assess checks whether the baseline is matched or not?
	Assess(baseline v1alpha1.ComplianceBaseline) error

	// FromJSON store JSON data into store.
	// Any error happened here MUST cause Validate() returns non nil error.
	FromJSON(str string)

	// ToJSON outputs the data in the store as JSON string.
	ToJSON() string
}
