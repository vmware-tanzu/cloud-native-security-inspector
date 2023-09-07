package main

import (
	"context"
	"flag"
	"os"
	"os/exec"
	"time"

	pkgloadscanner "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner"
	pkgclient "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/pkgload-scanner/client"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/data/providers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/lib/log"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
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

//+kubebuilder:rbac:groups="",resources=pods,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=apps,resources=replicasets,verbs=get;list;watch;create;update;patch;delete

func main() {
	var policy string
	flag.StringVar(&policy, "policy", "", "name of the inspection policy")
	flag.Parse()

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

	// get data source provider
	setting := &v1alpha1.Setting{}
	if err = k8sClient.Get(ctx, client.ObjectKey{Name: inspectionPolicy.Spec.SettingsName}, setting); err != nil {
		if !apierrors.IsNotFound(err) {
			log.Error(err, "unable to get setting")
		}
		// Ignore the not found error.
		os.Exit(1)
	}
	provider, err := providers.NewProvider(ctx, k8sClient, setting)
	if err != nil {
		log.Error(err, "failed to create provider")
		os.Exit(1)
	}

	// init client of pkg-scanner
	pkgscannerCmd := exec.Command("/scanner", "pkg-file-server")
	if err := pkgscannerCmd.Start(); err != nil {
		log.Error(err, "failed to start pkg-scanner")
		os.Exit(1)
	}
	go func() {
		for {
			if pkgscannerCmd.ProcessState != nil && pkgscannerCmd.ProcessState.Exited() {
				log.Error("pkg-scanner exited")
				os.Exit(1)
			}
		}
	}()
	defer pkgscannerCmd.Process.Kill()
	network := os.Getenv("PKG_SCANNER_NETWORK")
	addr := os.Getenv("PKG_SCANNER_ADDR")
	if network == "" || addr == "" {
		log.Error("pkg-scanner network or addr is empty")
		os.Exit(1)
	}
	pkgscannerClient := pkgclient.New(network, addr)
	timeoutSec := 30
	ctxTimeout, cancel := context.WithTimeout(context.Background(), time.Duration(timeoutSec)*time.Second)
	defer cancel()
	if err := pkgscannerClient.WaitForReady(ctxTimeout); err != nil {
		log.Error(err, "pkg-scanner is not ready after ", timeoutSec, " seconds")
		os.Exit(1)
	}

	// run pkgloadscanner controller
	runner := pkgloadscanner.NewController().
		WithScheme(scheme).
		WithK8sClient(k8sClient).
		WithAdapter(provider).
		WithPkgScanner(pkgscannerClient).
		CTRL()
	if err = runner.Run(ctx, inspectionPolicy); err != nil {
		log.Error(err, "risk manager controller run")
		os.Exit(1)
	}
}
