// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package errs

import "github.com/pkg/errors"

// Define simple specialized errors.

var (
	// NoDataError for the case that no data found when reading something.
	NoDataError = errors.New("no data found")
)
