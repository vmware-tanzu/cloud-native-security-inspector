// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0

package e2e

import (
	"context"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/test/e2e/setting"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"os"
	"sigs.k8s.io/e2e-framework/klient/decoder"
	"sigs.k8s.io/e2e-framework/klient/k8s/resources"
	"sigs.k8s.io/e2e-framework/pkg/envconf"
	"sigs.k8s.io/e2e-framework/pkg/features"
	"testing"
)

var createSetting = func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
	r, err := resources.New(c.Client().RESTConfig())
	if err != nil {
		t.Fail()
	}
	setting.AddToScheme(r.GetScheme())
	r.WithNamespace(namespace)
	decoder.DecodeEachFile(
		ctx, os.DirFS("./setting"), "*.yaml",
		decoder.CreateHandler(r),
		decoder.MutateNamespace(namespace),
	)
	return ctx
}

func TestSettingCreation(t *testing.T) {
	feature := features.New("Setting").
		Setup(createSetting).
		Assess("Check If Resource created", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			r, err := resources.New(c.Client().RESTConfig())
			if err != nil {
				t.Fail()
			}
			r.WithNamespace(namespace)
			setting.AddToScheme(r.GetScheme())
			settings := &v1alpha1.Setting{}
			err = r.Get(ctx, "setting-test", namespace, settings)
			if err != nil {
				t.Fail()
			}
			log.Debug("CR Details", "cr", settings)
			return ctx
		}).Feature()

	testEnv.Test(t, feature)
}

func TestSettingDeletion(t *testing.T) {
	feature := features.New("Setting_Deletion").
		Setup(createSetting).
		Assess("Check If Resource deleted", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			r, err := resources.New(c.Client().RESTConfig())
			if err != nil {
				t.Fail()
			}
			r.WithNamespace(namespace)
			setting.AddToScheme(r.GetScheme())
			settings := &v1alpha1.Setting{
				ObjectMeta: metav1.ObjectMeta{Name: "setting-test"},
			}
			err = r.Delete(ctx, settings)
			if err != nil {
				t.Fail()
			}
			log.Debug("CR Deleted", "cr", settings)
			return ctx
		}).Feature()

	testEnv.Test(t, feature)
}
