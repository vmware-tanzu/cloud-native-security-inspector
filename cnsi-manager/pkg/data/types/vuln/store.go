// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package vuln

import (
	"github.com/goharbor/go-client/pkg/sdk/v2.0/models"
	"github.com/goharbor/harbor/src/pkg/scan/vuln"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/core"
	"k8s.io/apimachinery/pkg/util/json"
)

/*var knownVulnerabilitySeverities = []vuln.Severity{
	vuln.None,
	vuln.Unknown,
	vuln.Low,
	vuln.Medium,
	vuln.High,
	vuln.Critical,
}*/

// Store for storing vulnerability data.
type Store struct {
	ArtifactID core.ArtifactID
	// Refer the harbor vulnerability data model.
	Data models.NativeReportSummary
	// Error object if any error occurred.
	Err error
}

// Metadata implements types.Store.
func (s *Store) Metadata() core.Metadata {
	return core.Metadata{
		Kind:    core.DataTypeVulnerability,
		Version: core.DataVersionVulnerability,
		Scheme:  core.DataSchemeVulnerability,
	}
}

// Validate implements types.Store.
func (s *Store) Validate() error {
	return s.Err
}

// SetError implements types.Store.
func (s *Store) SetError(err error) {
	s.Err = err
}

// FillIn implements types.Store.
func (s *Store) FillIn(artifactID core.ArtifactID, data interface{}) {
	if len(artifactID.String()) == 0 {
		s.Err = errors.New("empty artifact ID")
		return
	}

	if data == nil {
		s.Err = errors.New("nil data to fill in")
		return
	}

	vulSummary, ok := data.(models.NativeReportSummary)
	if !ok {
		s.Err = errors.Errorf("invalid data model: require models.NativeReportSummary")
		return
	}

	s.Data = vulSummary
}

// ForArtifact implements types.Store.
func (s *Store) ForArtifact() core.ArtifactID {
	return s.ArtifactID
}

// Assess implements types.Store.
func (s *Store) Assess(baseline v1alpha1.ComplianceBaseline) error {
	if s.Err != nil {
		return errors.Wrap(s.Err, "assess")
	}

	expectedSev := vuln.ParseSeverityVersion3(baseline.Baseline)
	currentSev := vuln.ParseSeverityVersion3(s.Data.Severity)
	if currentSev.Code() > expectedSev.Code() {
		return errors.Errorf("expect vulnerability severity <= %s but got %s", expectedSev, currentSev)
	}

	return nil
}

// FromJSON implements types.Store.
func (s *Store) FromJSON(str string) {
	if len(str) == 0 {
		s.Err = errors.New("empty JSON data for filling in")
	}

	if e := json.Unmarshal([]byte(str), s); e != nil {
		s.Err = e
	}
}

// ToJSON implements types.Store.
func (s *Store) ToJSON() string {
	dt, err := json.Marshal(s)
	if err != nil {
		return ""
	}

	return string(dt)
}
