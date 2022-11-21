// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package main

import (
	"context"
	"flag"
	"go.uber.org/zap/zapcore"
	"os"

	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/inspection"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

var (
	log     = ctrl.Log.WithName("inspector")
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
	opts := zap.Options{
		Development:     true,
		Level:           zapcore.DebugLevel,
		StacktraceLevel: zapcore.ErrorLevel,
	}
	opts.BindFlags(flag.CommandLine)
	flag.Parse()

	ctrl.SetLogger(zap.New(zap.UseFlagOptions(&opts)))

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

	runner := inspection.NewController().
		WithScheme(scheme).
		WithLogger(log).
		WithK8sClient(k8sClient).
		CTRL()

	if err := runner.Run(ctx, inspectionPolicy); err != nil {
		log.Error(err, "controller run")
		os.Exit(1)
	}
}
