// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0

package e2e

import (
	"os"
	"testing"

	"sigs.k8s.io/e2e-framework/pkg/env"
	"sigs.k8s.io/e2e-framework/pkg/envconf"
	"sigs.k8s.io/e2e-framework/pkg/envfuncs"
)

var (
	testEnv         env.Environment
	kindClusterName string
	namespace       string
)

func TestMain(m *testing.M) {
	cfg, _ := envconf.NewFromFlags()
	testEnv = env.NewWithConfig(cfg)
	kindClusterName = envconf.RandomName("cnsi-crdtest-", 16)
	namespace = envconf.RandomName("cnsi-test-ns", 10)

	testEnv.Setup(
		envfuncs.CreateKindCluster(kindClusterName),
		envfuncs.CreateNamespace(namespace),
		envfuncs.SetupCRDs("../../tools/installation/yaml", "*"),
	)

	testEnv.Finish(
		envfuncs.DeleteNamespace(namespace),
		envfuncs.TeardownCRDs("../../tools/installation/yaml", "*"),
		envfuncs.DestroyKindCluster(kindClusterName),
	)

	os.Exit(testEnv.Run(m))
}
