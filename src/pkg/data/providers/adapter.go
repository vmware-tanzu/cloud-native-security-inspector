// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package providers

import "goharbor.io/k8s-security-inspector/pkg/data"

// Adapter for handing data from the upstream data provider.
type Adapter interface {
	data.HealthChecker
	data.Reader
	data.Requester
	data.Register
	data.Configurator
}
