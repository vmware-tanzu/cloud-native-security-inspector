// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package core

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/suite"
)

// TypesSuite for testing ArtifactID.
type TypesSuite struct {
	suite.Suite
}

// TestTypes is the entry method of suite TypesSuite.
func TestTypes(t *testing.T) {
	suite.Run(t, &TypesSuite{})
}

func (suite *TypesSuite) TestParse() {
	image := "k8s.gcr.io/kube-controller-manager:v1.21.1"
	imageID := "sha256:2b0d1414865856cf0e35682c350808192a9a97cf408816cd97fdcbeedf870b4a"

	ID := ParseArtifactIDFrom(image, imageID)
	suite.Equal(fmt.Sprintf("k8s.gcr.io/kube-controller-manager@%s", imageID), ID.String())
}

func (suite *TypesSuite) TestParseOverlap() {
	image := "docker.io/library/nginx:1.14.2"
	imageID := "docker.io/library/nginx@sha256:706446e9c6667c0880d5da3f39c09a6c7d2114f5a5d6b74a2fafd24ae30d2078"

	ID := ParseArtifactIDFrom(image, imageID)
	suite.Equal(fmt.Sprintf("docker.io/library/nginx@sha256:706446e9c6667c0880d5da3f39c09a6c7d2114f5a5d6b74a2fafd24ae30d2078"), ID.String())
}

func (suite *TypesSuite) TestParseNoneRegular() {
	image := "sha256:706446e9c6667c0880d5da3f39c09a6c7d2114f5a5d6b74a2fafd24ae30d2078"
	imageID := "docker.io/library/nginx@sha256:706446e9c6667c0880d5da3f39c09a6c7d2114f5a5d6b74a2fafd24ae30d2078"

	ID := ParseArtifactIDFrom(image, imageID)
	suite.Equal(imageID, ID.String())
}

func (suite *TypesSuite) TestFullRepo() {
	image := "docker.io/library/nginx:1.14.2"
	imageID := "docker.io/library/nginx@sha256:706446e9c6667c0880d5da3f39c09a6c7d2114f5a5d6b74a2fafd24ae30d2078"
	ID := ParseArtifactIDFrom(image, imageID)

	suite.Equal("sha256:706446e9c6667c0880d5da3f39c09a6c7d2114f5a5d6b74a2fafd24ae30d2078", ID.Digest())
	suite.Equal("nginx", ID.Repository())
	suite.Equal("library", ID.Namespace())
	suite.Equal("docker.io", ID.Registry())
}

func (suite *TypesSuite) TestRepo() {
	image := "k8s.gcr.io/kube-controller-manager:v1.21.1"
	imageID := "k8s.gcr.io/kube-controller-manager@sha256:2b0d1414865856cf0e35682c350808192a9a97cf408816cd97fdcbeedf870b4a"
	ID := ParseArtifactIDFrom(image, imageID)

	suite.Equal("sha256:2b0d1414865856cf0e35682c350808192a9a97cf408816cd97fdcbeedf870b4a", ID.Digest())
	suite.Equal("kube-controller-manager", ID.Repository())
	suite.Equal("library", ID.Namespace())
	suite.Equal("k8s.gcr.io", ID.Registry())
}

func (suite *TypesSuite) TestTag() {
	image := "k8s.gcr.io/kube-controller-manager:v1.21.1"
	imageID := "k8s.gcr.io/kube-controller-manager@sha256:2b0d1414865856cf0e35682c350808192a9a97cf408816cd97fdcbeedf870b4a"
	ID := ParseArtifactIDFrom(image, imageID)

	suite.Equal("v1.21.1", ID.Tag())
}

func (suite *TypesSuite) TestOmittedRegistryCase() {
	image := "mariadb:10"
	imageID := "mariadb@sha256:8c15c3def7ae1bb408c96d322a3cc0346dba9921964d8f9897312fe17e127b90"
	ID := ParseArtifactIDFrom(image, imageID)
	suite.Equal("10", ID.tag)
	suite.Equal("library", ID.Namespace())
	suite.Equal("docker.io", ID.Registry())
	suite.Equal("mariadb", ID.Repository())
	suite.Equal("sha256:8c15c3def7ae1bb408c96d322a3cc0346dba9921964d8f9897312fe17e127b90", ID.Digest())
}

func (suite *TypesSuite) TestOmittedRegistryWithOrg() {
	image := "federatedai/kubefate:v1.4.5"
	imageID := "federatedai/kubefate@sha256:13b6d5b836f561fd035819ce53f8a97dfeaf703cddbf0d5974f56c9040f1831"
	ID := ParseArtifactIDFrom(image, imageID)
	suite.Equal("v1.4.5", ID.tag)
	suite.Equal("federatedai", ID.Namespace())
	suite.Equal("docker.io", ID.Registry())
	suite.Equal("kubefate", ID.Repository())
	suite.Equal("sha256:13b6d5b836f561fd035819ce53f8a97dfeaf703cddbf0d5974f56c9040f1831", ID.Digest())
}
