package e2e

import (
	"context"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	appsv1 "k8s.io/api/apps/v1"
	"sigs.k8s.io/e2e-framework/klient/k8s/resources"
	"sigs.k8s.io/e2e-framework/pkg/envconf"
	"sigs.k8s.io/e2e-framework/pkg/features"
	"testing"
)

func TestExporter(t *testing.T) {

	// Test exporter can work as expected
	exporter := features.New("exporter").
		Assess("Check if exporter can be up and work properly",
			func(ctx context.Context, t *testing.T, config *envconf.Config) context.Context {
				var exporterDeployment appsv1.Deployment
				r, err := resources.New(config.Client().RESTConfig())
				if err != nil {
					log.Error(err)
					t.Fail()
				}
				err = r.Get(ctx, "cnsi-exporter", "cnsi-system", &exporterDeployment)
				if err != nil {
					log.Errorf("got an issue when try to check if the cnsi exporter deployment exist, err: %s", err)
					t.Fail()
				} else {
					deploymentName := "cnsi-exporter"
					err = waitPodReady(ctx, r, deploymentName, "cnsi-system", 30, 3, 1)
					if err != nil {
						log.Errorf("failed to check the pod readiness, err: %s", err.Error())
						t.Fail()
					}
				}
				// TODO: when we point the output of Kubebench scanner to exporter, we can verify that the report data
				// can be posted on opensearch.
				return ctx
			}).Feature()
	testEnv.Test(t, exporter)
}
