// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package core

import (
	"errors"
	"fmt"
	"strings"
)

var (
	// ErrorArtifactNotFound represents whether error not found.
	ErrorArtifactNotFound = errors.New("artifact not found")
)

// IsArtifactNotFoundError checks error whether artifact not found.
func IsArtifactNotFoundError(err error) bool {
	return errors.Is(err, ErrorArtifactNotFound)
}

// ArtifactID is used to identify the artifact.
// Use imageID format in the container status.
// E.g: ghcr.io/goharbor/harbor-core@sha256:45dad4ee4e982ed42ec29b678321cde66dc30542612044b672082bf1d5a28d7e
type ArtifactID struct {
	artifactID string
	tag        string
}

// ParseArtifactIDFrom parse artifact ID from the image and imageID fields of the pod container.
func ParseArtifactIDFrom(image, imageID string) ArtifactID {
	art := ArtifactID{}
	fullRepo := image
	// Exclude none regular format, e.g: sha256:xxxxx.
	if i0 := strings.LastIndex(fullRepo, "sha256:"); i0 != -1 {
		fullRepo = fullRepo[0:i0]
		// Nothing left.
		if len(fullRepo) == 0 {
			art.artifactID = imageID
			return art
		}
	}

	if !strings.Contains(fullRepo, "/") {
		// The omitted registry means docker.io
		fullRepo = fmt.Sprintf("docker.io/%s", fullRepo)
	} else {
		namespaceOrRegistry := fullRepo[:strings.Index(fullRepo, "/")]
		if !strings.Contains(namespaceOrRegistry, ".") {
			// This should be a namespace, the docker.io is omitted
			fullRepo = fmt.Sprintf("docker.io/%s", fullRepo)
		}
	}

	// Digest format repo@sha256:.
	if i1 := strings.LastIndex(image, "@"); i1 != -1 {
		fullRepo = fullRepo[:i1]
	}

	// Might be normal tag format repo:tag
	if i2 := strings.LastIndex(fullRepo, ":"); i2 != -1 {
		art.tag = fullRepo[i2+1:]
		fullRepo = fullRepo[:i2]
	}

	if i3 := strings.LastIndex(imageID, "sha256:"); i3 != -1 {
		art.artifactID = fmt.Sprintf("%s@%s", fullRepo, imageID[i3:])
		return art
	}

	return art
}

// String value of the ArtifactID.
func (a ArtifactID) String() string {
	return a.artifactID
}

// Digest of the artifact.
func (a ArtifactID) Digest() string {
	if len(a.artifactID) == 0 {
		return ""
	}

	return a.artifactID[strings.LastIndex(a.String(), "@sha256:")+1:]
}

// Repository of the artifact.
func (a ArtifactID) Repository() string {
	if len(a.artifactID) == 0 {
		return ""
	}

	as := a.String()
	return a.artifactID[strings.LastIndex(as, "/")+1 : strings.LastIndex(as, "@")]
}

// Namespace or project of the artifact.
func (a ArtifactID) Namespace() string {
	if len(a.artifactID) == 0 {
		return ""
	}

	ns := a.artifactID[:strings.LastIndex(a.String(), "/")]
	segments := strings.Split(ns, "/")

	if strings.Contains(segments[0], ".") {
		if len(segments) == 1 {
			// Not contain namespace, return default one.
			return "library"
		}

		return strings.TrimPrefix(ns, fmt.Sprintf("%s/", segments[0]))
	}

	return ns
}

// Registry of the artifact.
func (a ArtifactID) Registry() string {
	if len(a.artifactID) == 0 {
		return ""
	}

	ns := a.artifactID[:strings.LastIndex(a.String(), "/")]
	segments := strings.Split(ns, "/")

	if strings.Contains(segments[0], ".") {
		return segments[0]
	}

	return ""
}

// Tag of the artifact.
func (a ArtifactID) Tag() string {
	return a.tag
}

// Metadata of the security data.
type Metadata struct {
	// Kind of the data.
	Kind string
	// Version of the data scheme.
	Version string
	// Data scheme used.
	Scheme string
}

// String value of the metadata that can be used as a UUID.
func (m Metadata) String() string {
	return fmt.Sprintf("%s:%s:%s", m.Kind, m.Version, m.Scheme)
}

// Equal checks if the two metadata are totally same.
func (m Metadata) Equal(another Metadata) bool {
	return m.String() == another.String()
}

const (
	// DataTypeVulnerability defines a kind for vulnerability.
	DataTypeVulnerability = "vulnerability"
	// DataVersionVulnerability defines version of the vulnerability data scheme.
	DataVersionVulnerability = "v1.1"
	// DataSchemeVulnerability defines the data scheme used for storing and parsing.
	DataSchemeVulnerability = "application/vnd.security.vulnerability.report; version=1.1"
)
