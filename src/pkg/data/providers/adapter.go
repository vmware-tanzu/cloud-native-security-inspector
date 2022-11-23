// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package providers

import "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data"

// Adapter for handing data from the upstream data provider.
type Adapter interface {
	data.HealthChecker
	data.Reader
	data.Requester
	data.Register
	data.Configurator
	data.Artifact
}
