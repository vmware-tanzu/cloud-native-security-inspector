package main

import (
	"context"
	"flag"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	es "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/es"
	osearch "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/opensearch"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/providers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspection/riskmanager"
	"go.uber.org/zap/zapcore"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	logDefault "log"
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
		setting := &v1alpha1.Setting{}
		if err = k8sClient.Get(ctx, client.ObjectKey{Name: inspectionPolicy.Spec.SettingsName}, setting); err != nil {
			if !apierrors.IsNotFound(err) {
				log.Error(err, "unable to get setting")
			}
			// Ignore the not found error.
			os.Exit(1)
		}

		// get data source provider
		provider, err := providers.NewProvider(ctx, k8sClient, setting)
		if err != nil {
			log.Error(err, "failed to create provider")
			os.Exit(1)
		}

		conf := riskmanager.ReadEnvConfig()

		logDefault.Default().Printf("mode server-only")
		var osExporter osearch.OpenSearchExporter
		if inspectionPolicy.Spec.Inspection.Assessment.OpenSearchEnabled {
			logDefault.Default().Printf("OS config addr: %s", inspectionPolicy.Spec.Inspection.Assessment.OpenSearchAddr)
			logDefault.Default().Printf("OS config username: %s", inspectionPolicy.Spec.Inspection.Assessment.OpenSearchUser)
			osClient := osearch.NewClient([]byte{},
				inspectionPolicy.Spec.Inspection.Assessment.OpenSearchAddr,
				inspectionPolicy.Spec.Inspection.Assessment.OpenSearchUser,
				inspectionPolicy.Spec.Inspection.Assessment.OpenSearchPasswd)

			if osClient == nil {
				log.Info("OpenSearch client is nil", nil, nil)
				os.Exit(1)
			}

			osExporter = osearch.OpenSearchExporter{Client: osClient, Logger: log}
			err = osExporter.NewExporter(osClient, conf.DetailIndex)
			if err != nil {
				log.Error(err, "new os export risk_manager_details")
				os.Exit(1)
			}
		}

		var esExporter es.ElasticSearchExporter
		if inspectionPolicy.Spec.Inspection.Assessment.ElasticSearchEnabled {
			cert := []byte(inspectionPolicy.Spec.Inspection.Assessment.ElasticSearchCert)
			logDefault.Default().Printf("ES config addr: %s", inspectionPolicy.Spec.Inspection.Assessment.ElasticSearchAddr)
			logDefault.Default().Printf("ES config username: %s", inspectionPolicy.Spec.Inspection.Assessment.ElasticSearchPasswd)
			esClient := es.NewClient(
				cert,
				inspectionPolicy.Spec.Inspection.Assessment.ElasticSearchAddr,
				inspectionPolicy.Spec.Inspection.Assessment.ElasticSearchUser,
				inspectionPolicy.Spec.Inspection.Assessment.ElasticSearchPasswd)
			if esClient == nil {
				logDefault.Default().Printf("ES client is nil")
				os.Exit(1)
			}

			esExporter = es.ElasticSearchExporter{Client: esClient, Logger: log}
			err = esExporter.NewExporter(esClient, conf.DetailIndex)
			if err != nil {
				log.Error(err, "new es export risk_manager_details")
				//Error Handling
				os.Exit(1)
			}
		}

		server := riskmanager.NewServer(&osExporter, &esExporter).WithAdapter(provider)
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
	}
}
