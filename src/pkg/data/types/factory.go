// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package types

import (
	"github.com/pkg/errors"
	"goharbor.io/k8s-security-inspector/pkg/data/core"
	"goharbor.io/k8s-security-inspector/pkg/data/types/vuln"
)

var _ Store = &vuln.Store{}

// Available stores
var (
	// VulStoreMeta defines metadata of vulnerability store for Harbor.
	VulStoreMeta = core.Metadata{
		Kind:    core.DataTypeVulnerability,
		Version: core.DataVersionVulnerability,
		Scheme:  core.DataSchemeVulnerability,
	}
)

// GetStore is factory method for creating a Store depends on the metadata provided.
func GetStore(meta core.Metadata) (Store, error) {
	switch meta.String() {
	case VulStoreMeta.String():
		return &vuln.Store{}, nil
	}

	return nil, errors.Errorf("no store implemented for: %s", meta.String())
}
