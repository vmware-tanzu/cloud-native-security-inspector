// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package cache

import "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data"

// Client for caching data.
type Client interface {
	data.Reader
	data.Writer
}
