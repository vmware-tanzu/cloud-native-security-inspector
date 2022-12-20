// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package log

// Formatter formats records in different ways: text, json, etc.
type Formatter interface {
	Format(*Entry) ([]byte, error)
}
