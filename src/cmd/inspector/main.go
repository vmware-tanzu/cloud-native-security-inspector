// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package main

import (
	"context"
	"flag"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspection"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"os"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var (
	scheme  = runtime.NewScheme()
	rootCtx = context.Background()
)

func init() {
	utilruntime.Must(clientgoscheme.AddToScheme(scheme))
	utilruntime.Must(v1alpha1.AddToScheme(scheme))
}

//+kubebuilder:rbac:groups=networking.k8s.io,resources=networkpolicies,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="",resources=pods,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=apps,resources=replicasets,verbs=get;list;watch;create;update;patch;delete

func main() {
	var policy string

	flag.StringVar(&policy, "policy", "", "name of the inspection policy")
	flag.Parse()
	log.Infof("policy name %s", policy)
	log.Info("inspector scanning")

	k8sClient, err := client.New(ctrl.GetConfigOrDie(), client.Options{
		Scheme: scheme,
	})

	if err != nil {
		log.Error(err, "unable to create k8s client")
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(rootCtx)
	defer cancel()

	// Get the policy CR details.
	inspectionPolicy := &v1alpha1.InspectionPolicy{}
	if err := k8sClient.Get(ctx, client.ObjectKey{Name: policy}, inspectionPolicy); err != nil {
		log.Error(err, "unable to retrieve the specified inspection policy")
		os.Exit(1)
	}

	if inspectionPolicy.Spec.Inspection.Assessment.Governor.Enabled {
		ctx = context.WithValue(ctx, "cspSecretName", inspectionPolicy.Spec.Inspection.Assessment.Governor.CspSecretName)
	}

	runner := inspection.NewController().
		WithScheme(scheme).
		WithK8sClient(k8sClient).
		CTRL()

	if err := runner.Run(ctx, inspectionPolicy); err != nil {
		log.Error(err, "controller run")
		os.Exit(1)
	}
}
