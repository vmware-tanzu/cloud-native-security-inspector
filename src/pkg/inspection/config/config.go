// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package config

import (
	"errors"
	"fmt"
	"strings"

	goharborv1 "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"k8s.io/apimachinery/pkg/util/json"
)

// ParseConfig parse inspection config from JSON data.
func ParseConfig(data string) (*goharborv1.InspectionConfiguration, error) {
	if strings.TrimSpace(data) == "" {
		return nil, errors.New("empty inspection config")
	}

	config := &goharborv1.InspectionConfiguration{}
	if err := json.Unmarshal([]byte(data), config); err != nil {
		return nil, fmt.Errorf("parse inspection config error: %w", err)
	}

	return config, nil
}
