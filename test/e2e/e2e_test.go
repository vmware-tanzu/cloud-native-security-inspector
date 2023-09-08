// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0

package e2e

import (
	"bytes"
	"context"
	"errors"
	"os"
	"sigs.k8s.io/e2e-framework/klient/wait"
	"sigs.k8s.io/e2e-framework/klient/wait/conditions"
	"strings"
	"testing"
	"time"

	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/test/e2e/inspectionpolicy"
	"github.com/vmware-tanzu/cloud-native-security-inspector/test/e2e/setting"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/e2e-framework/klient/decoder"
	"sigs.k8s.io/e2e-framework/klient/k8s/resources"
	"sigs.k8s.io/e2e-framework/pkg/env"
	"sigs.k8s.io/e2e-framework/pkg/envconf"
	"sigs.k8s.io/e2e-framework/pkg/envfuncs"
	"sigs.k8s.io/e2e-framework/pkg/features"
	v1 "k8s.io/api/core/v1"
)

var (
	testEnv         env.Environment
	kindClusterName string
	namespace       string
)

// Added a namespace named opensearch in order to deploy opensearch on it
func TestMain(m *testing.M) {
	cfg, _ := envconf.NewFromFlags()
	testEnv = env.NewWithConfig(cfg)
	kindClusterName = envconf.RandomName("cnsi-crdtest-", 16)
	namespace = envconf.RandomName("cnsi-test-ns", 10)

	testEnv.Setup(
		envfuncs.CreateKindCluster(kindClusterName),
		envfuncs.CreateNamespace(namespace),
		envfuncs.CreateNamespace("opensearch"),
		envfuncs.SetupCRDs("../../deployments/yaml", "manager.yaml"),
		envfuncs.SetupCRDs("../../deployments/yaml", "data-exporter.yaml"),
	)

	testEnv.Finish(
		envfuncs.DeleteNamespace(namespace),
		envfuncs.DeleteNamespace("opensearch"),
		envfuncs.TeardownCRDs("../../deployments/yaml", "*"),
		envfuncs.DestroyKindCluster(kindClusterName),
	)
	os.Exit(testEnv.Run(m))
}

var createSetting = func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
	r, err := resources.New(c.Client().RESTConfig())
	if err != nil {
		t.Fail()
	}
	err = decoder.DecodeEachFile(
		ctx, os.DirFS("./setting"), "*.yaml",
		decoder.CreateHandler(r),
		decoder.MutateNamespace(namespace),
	)
	if err != nil {
		t.Fail()
		log.Fatalf("failed to create the setting, err: %s", err)
	}
	return ctx
}

var createInspectionPolicy = func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
	r, err := resources.New(c.Client().RESTConfig())
	if err != nil {
		t.Fail()
	}
	err = decoder.DecodeEachFile(
		ctx, os.DirFS("./inspectionpolicy"), "*.yaml",
		decoder.CreateHandler(r),
		decoder.MutateNamespace(namespace),
	)
	if err != nil {
		t.Fail()
		log.Fatalf("failed to create the policy, err: %s", err)
	}
	return ctx
}

func TestE2E(t *testing.T) {
	/* kubeSystem  ensures that kube-system and its pods are up and running before e2e testing can begin */
	kubeSystem := features.New("check kube-system is up").
		WithLabel("type", "pod counting in kube-system").
		Assess("pods from kube-system", func(ctx context.Context, t *testing.T, cfg *envconf.Config) context.Context {
			var pods corev1.PodList
			err := cfg.Client().Resources("kube-system").List(context.TODO(), &pods)
			if err != nil {
				t.Fatal(err)
			}
			if len(pods.Items) == 0 {
				t.Fatal("zero in namespace kube-system")
			}
			return ctx
		}).Feature()
	testEnv.Test(t, kubeSystem)

	/* countNameSpaces ensures that kube-system and cnsi-system pods are up and running before e2e testing can begin */
	countNameSpaces := features.New("count namespaces and cnsi-system").
		WithLabel("type", "ns-count").
		Assess("namespace exist", func(ctx context.Context, t *testing.T, cfg *envconf.Config) context.Context {
			var nspaces corev1.NamespaceList
			err := cfg.Client().Resources().List(context.TODO(), &nspaces)
			if err != nil {
				t.Fatal(err)
			}
			if len(nspaces.Items) >= 1 {
				t.Logf("Multipe namespaces found")
			}

			return ctx
		}).Feature()
	testEnv.Test(t, countNameSpaces)

	/* Connectivity feature checks external connectivity in order to see if we can pull opensearch image if needed */
	connectivity := features.New("external connectivity check").
		Setup(func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			deployment := newDeployment("cnsi-system", "check-harbor", 1, "curl")
			client, err := c.NewClient()
			if err != nil {
				t.Fatal(err)
			}
			if err := client.Resources().Create(ctx, deployment); err != nil {
				t.Fatal(err)
			}
			err = wait.For(conditions.New(client.Resources()).DeploymentConditionMatch(deployment, appsv1.DeploymentAvailable, v1.ConditionTrue), wait.WithTimeout(time.Minute*5))
			if err != nil {
				t.Fatal(err)
			}

			return ctx
		}).
		Assess("check external connectivity", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			client, err := c.NewClient()
			if err != nil {
				t.Fatal(err)
			}
			pods := &corev1.PodList{}
			err = client.Resources("cnsi-system").List(context.TODO(), pods)
			if err != nil || pods.Items == nil {
				t.Error("error while getting pods", err)
			}
			var stdout, stderr bytes.Buffer
			podName := pods.Items[0].Name
			command := []string{"curl", "-I", "https://www.google.com"}

			if err := client.Resources().ExecInPod(context.TODO(), "cnsi-system", podName, "curl", command, &stdout, &stderr); err != nil {
				t.Log(stderr.String())
				t.Fatal(err)
			}
			httpStatus := strings.Split(stdout.String(), "\n")[0]
			if !strings.Contains(httpStatus, "200") {
				t.Fatal("Couldn't connect externally")
			} else {
				t.Log("external connection established")
			}
			return ctx
		}).Feature()
	testEnv.Test(t, connectivity)

	/* Deploying opensearch, if opensearch is installed the feature will move out */
	deployOpensearch := features.New("deploy opensearch").
		Setup(func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			deployment := deployOpenSearch("opensearch", "opensearch", 1, "opensearch")
			client, err := c.NewClient()
			if err != nil {
				t.Fatal(err)
			}
			if err := client.Resources().Create(ctx, deployment); err != nil {
				t.Fatal(err)
			}
			err = wait.For(conditions.New(client.Resources()).DeploymentConditionMatch(deployment, appsv1.DeploymentAvailable, v1.ConditionTrue), wait.WithTimeout(time.Minute*5))
			if err != nil {
				t.Fatal(err)
			}
			return ctx
		}).
		Assess("deploying opensearch", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			client, err := c.NewClient()
			if err != nil {
				t.Fatal(err)
			}
			pods := &corev1.PodList{}
			err = client.Resources(c.Namespace()).List(context.TODO(), pods)
			if err != nil || pods.Items == nil {
				t.Error("error while getting pods", err)
			} else {
				t.Log("opensearch installed successfully")
			}
			return ctx
		}).Feature()
	testEnv.Test(t, deployOpensearch)

	/* Check if opensearch is up and running, if so, we will see how many pods are running */
	checkOpenSearch := features.New("checkOpenSearch").
		Assess("get pods from opensearch", func(ctx context.Context, t *testing.T, cfg *envconf.Config) context.Context {
			var pods corev1.PodList
			err := cfg.Client().Resources("opensearch").List(context.TODO(), &pods)
			if err != nil {
				t.Fatal(err)
			}
			if len(pods.Items) == 0 {
				t.Fatal("no pods in namespace Opensearch")
			} else {
				t.Logf("found %d pods", len(pods.Items))
			}
			return ctx
		})
	testEnv.Test(t, checkOpenSearch.Feature())

	// Test manager can be up and run
	managerInstallation := features.New("create manager").
		Assess("Check if CNSI manager has been up",
			func(ctx context.Context, t *testing.T, config *envconf.Config) context.Context {
				var managerDeployment appsv1.Deployment
				r, err := resources.New(config.Client().RESTConfig())
				if err != nil {
					log.Error(err)
					t.Fail()
				}
				deploymentName := "cnsi-controller-manager"
				err = r.Get(ctx, deploymentName, "cnsi-system", &managerDeployment)
				if err != nil {
					log.Errorf("failed to check the pod readiness for %s exist, err: %s", deploymentName, err)
					t.Fail()
				} else {
					err = waitPodReady(ctx, r, deploymentName, "cnsi-system", 30, 30, 1)
					if err != nil {
						log.Errorf("failed to check the pod readiness, err: %s", err.Error())
						t.Fail()
					}
				}
				return ctx
			}).Feature()
	testEnv.Test(t, managerInstallation)

	// Test the setting can be created
	createSetting := features.New("create setting").
		Setup(createSetting).
		Assess("Check If Setting created", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			r, err := resources.New(c.Client().RESTConfig())
			if err != nil {
				log.Error(err.Error())
				t.Fail()
			}
			setting.AddToScheme(r.GetScheme())
			settings := &v1alpha1.Setting{}
			err = r.Get(ctx, "setting-test", namespace, settings)
			if err != nil {
				log.Error(err.Error())
				t.Fail()
			}
			log.Debug("CR Details", "cr", settings)
			return ctx
		}).Feature()
	testEnv.Test(t, createSetting)

	// Test the policy can be created
	createPolicy := features.New("create policy").
		Setup(createInspectionPolicy).
		Assess("Check If Policy created", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			r, err := resources.New(c.Client().RESTConfig())
			if err != nil {
				log.Error(err.Error())
				t.Fail()
			}
			inspectionpolicy.AddToScheme(r.GetScheme())
			policy := &v1alpha1.InspectionPolicy{}
			err = r.Get(ctx, "inspectionpolicy-test", namespace, policy)
			if err != nil {
				log.Error(err.Error())
				t.Fail()
			}
			return ctx
		}).Feature()

	testEnv.Test(t, createPolicy)

	// Test the Kubebench daemonSet can be created
	kubebenchDaemonSet := features.New("Kubebench daemonSet").
		Assess("Check if kubebench DaemonSet created",
			func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
				r, err := resources.New(c.Client().RESTConfig())
				if err != nil {
					log.Fatalf("failed to create the k8s client, err: %s", err.Error())
					t.Fail()
				}
				r.WithNamespace(namespace)
				var kubebenchDaemonSet appsv1.DaemonSet
				iterations := 5
				waitTime := 30
				for i := 0; i < iterations; i++ {
					// The reconciler may need some time for creating the DaemonSet
					err = r.Get(ctx, "inspectionpolicy-test-kubebench-daemonset", namespace, &kubebenchDaemonSet)
					if err != nil {
						if apierrors.IsNotFound(err) {
							time.Sleep(time.Duration(waitTime) * time.Second)
						} else {
							log.Fatalf("failed to get the kubebench daemonSet, err: %s", err.Error())
							t.Fail()
							return ctx
						}
					} else {
						log.Info("Verified that the kubebench daemonSet has been created")
						return ctx
					}
				}
				return ctx
			}).Feature()
	testEnv.Test(t, kubebenchDaemonSet)

	// Test the pkgload daemonSet can be created
	pkgloadDaemonSet := features.New("Pkgload daemonSet").
		Assess("Check if pkgload DaemonSet created",
			func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
				r, err := resources.New(c.Client().RESTConfig())
				if err != nil {
					log.Fatalf("failed to create the k8s client, err: %s", err.Error())
					t.Fail()
				}
				r.WithNamespace(namespace)
				var pkgloadDaemonSet appsv1.DaemonSet
				iterations := 5
				waitTime := 30
				for i := 0; i < iterations; i++ {
					// The reconciler may need some time for creating the DaemonSet
					err = r.Get(ctx, "inspectionpolicy-test-pkgload-daemonset", namespace, &pkgloadDaemonSet)
					if err != nil {
						if apierrors.IsNotFound(err) {
							time.Sleep(time.Duration(waitTime) * time.Second)
						} else {
							log.Fatalf("failed to get the pkgload daemonSet, err: %s", err.Error())
							t.Fail()
							return ctx
						}
					} else {
						log.Info("Verified that the pkgload daemonSet has been created")
						return ctx
					}
				}
				return ctx
			}).Feature()
	testEnv.Test(t, pkgloadDaemonSet)

	// Test the policy can be deleted
	deletePolicy := features.New("delete policy").
		Assess("Check If policy can be deleted", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			r, err := resources.New(c.Client().RESTConfig())
			if err != nil {
				t.Fail()
			}
			inspectionpolicy.AddToScheme(r.GetScheme())
			policy := &v1alpha1.InspectionPolicy{
				ObjectMeta: metav1.ObjectMeta{Name: "inspectionpolicy-test"},
			}
			err = r.Delete(ctx, policy)
			if err != nil {
				log.Fatalf("meet error when deleting policy, err: %s", err.Error())
				t.Fail()
			}
			err = r.Get(ctx, "inspectionpolicy-test", "", policy)
			if apierrors.IsNotFound(err) {
				log.Info("deleted the policy successfully")
				return ctx
			}
			log.Errorf("cannot delete the policy, err: %s", err.Error())
			t.Fail()
			return ctx
		}).Feature()
	testEnv.Test(t, deletePolicy)

	deleteSetting := features.New("delete setting").
		Assess("Check If setting can be deleted", func(ctx context.Context, t *testing.T, c *envconf.Config) context.Context {
			r, err := resources.New(c.Client().RESTConfig())
			if err != nil {
				t.Fail()
			}
			setting.AddToScheme(r.GetScheme())
			settings := &v1alpha1.Setting{
				ObjectMeta: metav1.ObjectMeta{Name: "setting-test"},
			}
			err = r.Delete(ctx, settings)
			if err != nil {
				t.Fail()
			}

			err = r.Get(ctx, "setting-test", "", settings)
			if apierrors.IsNotFound(err) {
				log.Info("deleted the setting successfully")
				return ctx
			}
			log.Errorf("cannot delete the setting, err: %s", err.Error())
			t.Fail()
			return ctx
		}).Feature()

	testEnv.Test(t, deleteSetting)
}

// waitPodReady will check the pod number of a deployment periodically, it will return when:
// 1. Timeout, when the total time > waitTime * iterations, returns error.
// 2. When the pod number >= expectedReplicas, returns nil.
// 3. An error occurs, returns the error.
func waitPodReady(
	ctx context.Context,
	r *resources.Resources,
	name, namespace string,
	waitTime, iterations, expectedReplicas int) error {
	log.Infof("start to check the readiness for deployment %s in namespace %s", name, namespace)
	var err error
	var deployment appsv1.Deployment
	for i := 0; i < iterations; i++ {
		err = r.Get(ctx, name, namespace, &deployment)
		if err != nil {
			log.Error("failed to get the deployment",
				name, namespace, err.Error())
			return err
		} else {
			if int(deployment.Status.ReadyReplicas) >= expectedReplicas {
				log.Infof("the deployment with %d replicas is ready", deployment.Status.ReadyReplicas)
				return nil
			} else {
				log.Infof("the deployment is not ready, wait %d seconds and recheck", waitTime)
				time.Sleep(time.Duration(waitTime) * time.Second)
			}
		}
	}
	return errors.New("time out when checking the pods of the deployment")
}

func newDeployment(namespace string, name string, replicas int32, containerName string) *appsv1.Deployment {
	labels := map[string]string{"app": "pod-exec"}
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: v1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: labels},
				Spec:       v1.PodSpec{Containers: []v1.Container{{Name: containerName, Image: "nginx"}}},
			},
		},
	}
}
func deployOpenSearch(namespace string, name string, replicas int32, containerName string) *appsv1.Deployment {
	labels := map[string]string{"app": "pod-exec"}
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: v1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: labels},
				Spec:       v1.PodSpec{Containers: []v1.Container{{Name: containerName, Image: "opensearchproject/opensearch"}}},
			},
		},
	}
}
