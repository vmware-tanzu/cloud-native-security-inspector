// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package enforcement

// Options defines options for policy enforcement.
type Options struct {
	Settings map[string]string
}

// Option is a func option for policy enforcement.
type Option func(options *Options)

// WithGeneralSettings define general settings option.
func WithGeneralSettings(settings map[string]string) Option {
	return func(options *Options) {
		if options.Settings == nil {
			options.Settings = make(map[string]string)
		}

		for k, v := range settings {
			options.Settings[k] = v
		}
	}
}
