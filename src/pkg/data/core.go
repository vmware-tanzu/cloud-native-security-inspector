// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package data

import (
	"context"
	"github.com/goharbor/harbor/src/pkg/scan/vuln"

	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/core"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/types"
)

// ReadOptions contains options for client reading.
type ReadOptions struct {
	// Metas of data to read.
	Metas []core.Metadata
}

// ReadOption is a read option template func.
type ReadOption func(opts *ReadOptions)

// WithMetadata defines read option for which metadata required.
func WithMetadata(meta core.Metadata) ReadOption {
	return func(opts *ReadOptions) {
		// Append metadata.
		opts.Metas = append(opts.Metas, meta)
	}
}

// Reader for reading or requesting security data from the upstream data provider.
type Reader interface {
	// Read data for the specified artifact.
	// If there are multiple data kinds supported by the upstream provider, then return them at the same time.
	// Any error occurred, non-nil error should be returned.
	Read(ctx context.Context, id core.ArtifactID, options ...ReadOption) ([]types.Store, error)
}

// Writer for writing security data to somewhere like cache.
type Writer interface {
	// Write the specified data to somewhere.
	Write(ctx context.Context, id core.ArtifactID, data []types.Store) error
}

// Requester is designed to issue request to the upstream provider for filling in the missing data.
type Requester interface {
	// Request the upstream data provider to create missing data for the specified artifact.
	// Request just asks for missing data and does not track the data creation process. If the data is ready,
	// it can be Read() next time.
	// As the data creation may need some time and can not be ready soon, this method may be called multiple times.
	// To avoid creating duplicated data creation processes, this method must be idempotent.
	Request(ctx context.Context, id core.ArtifactID) error
}

// HealthChecker is the interface for health check.
type HealthChecker interface {
	// Ping checks service whether ready.
	Ping(ctx context.Context) error
}

// Register is the interface for registering known registry to data source.
type Register interface {
	// RegisterKnownRegistries registers known registries to data source.
	RegisterKnownRegistries(ctx context.Context, registries []v1alpha1.KnownRegistry) error
}

// Configurator is the interface for configuring data source.
type Configurator interface {
	// ApplyConfig applies configurations to data source.
	ApplyConfig(ctx context.Context, ds v1alpha1.DataSource) error
}

type Artifact interface {
	GetVulnerabilitiesList(ctx context.Context, id core.ArtifactID) (*vuln.Report, error)
}
