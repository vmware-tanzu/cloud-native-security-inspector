package main

import (
	"context"
	"flag"
	"github.com/goharbor/harbor/src/jobservice/logger"
	"github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	osearch "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/opensearch"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/providers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/inspection/riskmanager"
	"go.uber.org/zap/zapcore"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"os"
	"os/signal"
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
	flag.StringVar(&mode, "mode", "", "running mode")

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
		setting := &v1alpha1.Setting{}
		if err = k8sClient.Get(ctx, client.ObjectKey{Name: inspectionPolicy.Spec.SettingsName}, setting); err != nil {
			if !apierrors.IsNotFound(err) {
				logger.Error(err, "unable to get setting")
			}
			// Ignore the not found error.
			os.Exit(1)
		}

		// get data source provider
		provider, err := providers.NewProvider(ctx, k8sClient, setting)
		if err != nil {
			logger.Error(err, "failed to create provider")
			os.Exit(1)
		}

		logger.Info("mode server-only")
		// Get the policy CR details.
		if !inspectionPolicy.Spec.Inspection.Assessment.OpenSearchEnabled {
			log.Info("OpenSearch disEnable")
			os.Exit(1)
		}

		logger.Info("OS config: ", "addr: ", inspectionPolicy.Spec.Inspection.Assessment.OpenSearchAddr)
		logger.Info("OS config: ", "username: ", inspectionPolicy.Spec.Inspection.Assessment.OpenSearchUser)
		logger.Info("OS config: ", "passwd: ", inspectionPolicy.Spec.Inspection.Assessment.OpenSearchPasswd)

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
		err = exporterDetail.NewExporter(client, conf.DetailIndex)
		if err != nil {
			log.Error(err, "new export risk_manager_details")
			//Error Handling
			os.Exit(1)
		}

		exporterAccessReport := osearch.OpenSearchExporter{Client: client, Logger: log}
		err = exporterAccessReport.NewExporter(client, "assessment_report")
		if err != nil {
			log.Error(err, "new export assessment_report")
			//Error handling
			os.Exit(1)
		}

		server := riskmanager.NewServer(&exporterDetail, &exporterAccessReport).WithAdapter(provider)
		server.Run(conf.Server)
	} else {
		runner := riskmanager.NewController().
			WithScheme(scheme).
			WithLogger(log).
			WithK8sClient(k8sClient).
			CTRL()

		if err = runner.Run(ctx, inspectionPolicy); err != nil {
			log.Error(err, "risk manager controller run")
			os.Exit(1)
		}

		// TODO 程序终止之后需要退出
		quit := make(chan os.Signal)
		signal.Notify(quit, os.Interrupt)
		<-quit
	}
}
