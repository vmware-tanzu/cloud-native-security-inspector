// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0

package e2e

import (
	"context"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/test/e2e/inspectionpolicy"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/test/e2e/setting"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"os"
	"testing"

	"sigs.k8s.io/e2e-framework/klient/decoder"
	"sigs.k8s.io/e2e-framework/klient/k8s/resources"
	"sigs.k8s.io/e2e-framework/pkg/envconf"
	"sigs.k8s.io/e2e-framework/pkg/features"
)

var createInspectionPolicy = func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
	r, err := resources.New(c.Client().RESTConfig())
	if err != nil {
		t.Fail()
	}
	inspectionpolicy.AddToScheme(r.GetScheme())
	r.WithNamespace(namespace)
	decoder.DecodeEachFile(
		ctx, os.DirFS("./inspectionpolicy"), "*.yaml",
		decoder.CreateHandler(r),
		decoder.MutateNamespace(namespace),
	)
	return ctx
}

func TestInspectionPolicyCreation(t *testing.T) {
	feature := features.New("Inspection Policy").
		Setup(createInspectionPolicy).
		Assess("Check If Resource created", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			r, err := resources.New(c.Client().RESTConfig())
			if err != nil {
				t.Fail()
			}
			r.WithNamespace(namespace)
			inspectionpolicy.AddToScheme(r.GetScheme())
			policy := &v1alpha1.InspectionPolicy{}
			err = r.Get(ctx, "inspectionpolicy-test", namespace, policy)
			if err != nil {
				t.Fail()
			}
			log.Info("CR Details", "cr", policy)
			return ctx
		}).Feature()

	testEnv.Test(t, feature)
}

func TestInspectionPolicyDeletion(t *testing.T) {
	feature := features.New("InspectionPolicy_Deletion").
		Setup(createInspectionPolicy).
		Assess("Check If Resource deleted", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			r, err := resources.New(c.Client().RESTConfig())
			if err != nil {
				t.Fail()
			}
			r.WithNamespace(namespace)
			setting.AddToScheme(r.GetScheme())
			policy := &v1alpha1.InspectionPolicy{
				ObjectMeta: metav1.ObjectMeta{Name: "inspectionpolicy-test"},
			}
			err = r.Delete(ctx, policy)
			if err != nil {
				t.Fail()
			}
			log.Debug("CR Deleted", "cr", policy)
			return ctx
		}).Feature()

	testEnv.Test(t, feature)
}
