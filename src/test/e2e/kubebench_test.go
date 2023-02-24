// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0

package e2e

import (
	"context"
	"fmt"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/test/e2e/inspectionpolicy"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/test/e2e/setting"
	appsv1 "k8s.io/api/apps/v1"
	"sigs.k8s.io/e2e-framework/klient/k8s/resources"
	"sigs.k8s.io/e2e-framework/pkg/envconf"
	"sigs.k8s.io/e2e-framework/pkg/features"
	"testing"
)

func TestKubebenchDaemonSetExist(t *testing.T) {
	feature := features.New("Kubebench-daemonSet").
		Setup(createSetting).Setup(createInspectionPolicy).
		Assess("Check if kubebench DaemonSet created",
			func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
				r, err := resources.New(c.Client().RESTConfig())
				if err != nil {
					fmt.Println(err)
					t.Fail()
				}
				r.WithNamespace(namespace)
				setting.AddToScheme(r.GetScheme())
				inspectionpolicy.AddToScheme(r.GetScheme())
				var kubebenchDaemonSet appsv1.DaemonSet
				var dsList appsv1.DaemonSetList
				err1 := r.List(ctx, &dsList)
				fmt.Println(err1)
				for _, ds := range dsList.Items {
					fmt.Println(ds.Name)
				}
				err = r.Get(ctx, "inspectionpolicy-test-kubebench-daemonset", namespace, &kubebenchDaemonSet)
				if err != nil {
					fmt.Println(err)
					t.Fail()
				}
				log.Debug("daemonSet Details", "cr", kubebenchDaemonSet)
				return ctx
			}).Feature()

	testEnv.Test(t, feature)
}
