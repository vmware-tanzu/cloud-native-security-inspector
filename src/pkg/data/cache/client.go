// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package cache

import "goharbor.io/k8s-security-inspector/pkg/data"

// Client for caching data.
type Client interface {
	data.Reader
	data.Writer
}
