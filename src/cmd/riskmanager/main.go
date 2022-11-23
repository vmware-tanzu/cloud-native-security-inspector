package main

import (
	"context"
	"flag"
	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	osearch "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/opensearch"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/inspection/riskmanager"
	"go.uber.org/zap/zapcore"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"os"
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

//+kubebuilder:rbac:groups="",resources=pods,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=apps,resources=replicasets,verbs=get;list;watch;create;update;patch;delete

func main() {
	var policy string
	var mode string
	flag.StringVar(&mode, "mode", "standalone", "running mode")
	flag.StringVar(&policy, "policy", "", "name of the inspection policy")
	opts := zap.Options{
		Development:     true,
		Level:           zapcore.DebugLevel,
		StacktraceLevel: zapcore.DebugLevel,
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

	if mode == "server-only" {
		// Get the policy CR details.

		client := osearch.NewClient([]byte{},
			inspectionPolicy.Spec.Inspection.Assessment.OpenSearchAddr,
			inspectionPolicy.Spec.Inspection.Assessment.OpenSearchUser,
			inspectionPolicy.Spec.Inspection.Assessment.OpenSearchPasswd)

		if client == nil {
			log.Info("OpenSearch client is nil", nil, nil)
			os.Exit(1)
		}

		conf := riskmanager.ReadEnvConfig()
		exporterDetail := osearch.OpenSearchExporter{Client: client, Logger: log}
		err := exporterDetail.NewExporter(client, "assessment_report")
		if err != nil {
			//Error Handling
			os.Exit(1)
		}

		exporterAccessReport := osearch.OpenSearchExporter{Client: client, Logger: log}
		err = exporterAccessReport.NewExporter(client, conf.DetailIndex)
		if err != nil {
			//Error handling
			os.Exit(1)
		}

		server := riskmanager.NewServer(&exporterDetail, &exporterAccessReport)
		server.Run(conf.Server)
	} else {
		runner := riskmanager.NewController().
			WithScheme(scheme).
			WithLogger(log).
			WithK8sClient(k8sClient).
			CTRL()

		if err := runner.Run(ctx, inspectionPolicy); err != nil {
			log.Error(err, "risk manager controller run")
			os.Exit(1)
		}
	}
}
