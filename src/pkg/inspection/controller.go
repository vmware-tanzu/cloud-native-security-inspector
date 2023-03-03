// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package inspection

import (
	"context"
	"fmt"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/cspauth"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	es "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/es"
	governor "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/governor"
	openapi "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/governor/go-client"
	osearch "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/opensearch"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"time"

	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/policy/enforcement"

	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/policy"

	ctrl "sigs.k8s.io/controller-runtime"

	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/core"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/providers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/runtime/grpool"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	reportNamePrefix = "assessment-report"
)

// Controller controls the inspection flow.
type Controller interface {
	// Run inspection.
	Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error
}

type controller struct {
	kc     client.Client
	scheme *runtime.Scheme
	ready  bool

	scanner Scanner
}

// NewController news a controller.
func NewController() *controller {
	return &controller{}
}

// WithK8sClient sets k8s client.
func (c *controller) WithK8sClient(cli client.Client) *controller {
	c.kc = cli
	return c
}

// WithScheme sets runtime scheme.
func (c *controller) WithScheme(scheme *runtime.Scheme) *controller {
	c.scheme = scheme
	return c
}

// CTRL returns controller interface.
func (c *controller) CTRL() Controller {
	c.scanner = NewScanner().
		WithScheme(c.scheme).
		UseClient(c.kc).
		Complete()

	// Mark controller is ready.
	c.ready = true

	return c
}

func (c *controller) EnsureSettings(ctx context.Context, policy *v1alpha1.InspectionPolicy) (*v1alpha1.Setting, error) {
	settingsName := policy.Spec.SettingsName
	if settingsName == "" {
		return nil, errors.New("Invalid settings name")
	}
	setting := &v1alpha1.Setting{}
	namespaced := types.NamespacedName{
		Name: settingsName,
	}
	if err := c.kc.Get(ctx, namespaced, setting); err != nil {
		if !apierrors.IsNotFound(err) {
			log.Error(err, "unable to get setting")
		}
		return nil, err
	}
	// if data source is disabled, return error.
	if setting.Spec.DataSource.Disabled {
		log.Info("The data source in settings is disabled")
		return nil, errors.New("Data source in settings is disabled!")
	}

	return setting, nil

}

// Run implements Controller.
func (c *controller) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	log.Info("In inspection controller...")
	if policy == nil {
		return errors.New("empty inspection policy config to runtime")
	}

	if !c.ready {
		return errors.New("controller is not ready: use CTRL() to init controller ")
	}

	// Get related security data first.
	setting, err := c.EnsureSettings(ctx, policy)

	if err != nil {
		log.Error(err, "unable to ensure the settings in inspection policy")
		return err
	}

	adapter, err := providers.NewProvider(ctx, c.kc, setting)
	if err != nil {
		return errors.Wrap(err, "get data provider adapter")
	}

	// Skip work namespace.
	skips := []string{*policy.Spec.WorkNamespace}

	nsl, err := c.scanner.ScanNamespaces(ctx, policy.Spec.Inspection.NamespaceSelector, skips)
	if err != nil {
		return errors.Wrap(err, "scan namespaces")
	}

	// Nothing to handle
	// Just in case.
	if len(nsl) == 0 {
		log.Info("no namespaces found")
		err2 := c.checkAndSendReportToGovernor(ctx, policy, &v1alpha1.AssessmentReport{})
		if err2 != nil {
			return err2
		}
		return nil
	}

	// Assessment report.
	cc := policy.Spec.Inspection.DeepCopy()
	//cc.DataProvider.Credential = nil
	report := &v1alpha1.AssessmentReport{
		ObjectMeta: metav1.ObjectMeta{
			Name:      fmt.Sprintf("%s-%s", reportNamePrefix, time.Now().UTC().Format("20060102-1504-05")),
			Namespace: *policy.Spec.WorkNamespace,
			Annotations: map[string]string{
				v1alpha1.CreationTimestampAnnotation: fmt.Sprintf("%d", time.Now().UTC().Unix()),
				v1alpha1.OwnerReferenceAnnotation:    policy.Name,
			},
		},
		Spec: v1alpha1.AssessmentReportSpec{
			InspectionConfiguration: *cc,
			NamespaceAssessments:    make([]*v1alpha1.NamespaceAssessment, 0),
		},
	}

	// Set owner reference when necessary.
	if policy.Spec.Inspection.Assessment.ManagedBy {
		if err := ctrl.SetControllerReference(policy, report, c.scheme); err != nil {
			return errors.Wrap(err, "set controller reference")
		}
	}

	// Use closure to warp the related parameters.
	inspectFac := func() func(workload v1alpha1.Workload) *v1alpha1.WorkloadAssessment {
		return func(workload v1alpha1.Workload) *v1alpha1.WorkloadAssessment {
			// Single pod
			if workload.Name == "" && len(workload.Pods) == 1 {
				workload.Name = workload.Pods[0].Name
				workload.Kind = "Pod"
				workload.APIVersion = workload.Pods[0].APIVersion
			}

			wa := &v1alpha1.WorkloadAssessment{
				Workload: workload,
				Passed:   true,
			}

			// Go through the pods of the workload.
			// Collect all the container (images).
			var containers []*v1alpha1.Container
			for _, p := range workload.Pods {
				// Loop containers of the pod.
				for _, c := range p.Containers {
					containers = append(containers, c)
				}
			}

			// In case, return earlier.
			if len(containers) == 0 {
				return wa
			}

			// Build data read options.
			// Only read the data for the inspection dimension defined in the baseline.
			var readOps []data.ReadOption
			for _, bl := range policy.Spec.Inspection.Baselines {
				readOps = append(readOps, data.WithMetadata(core.Metadata{
					Kind:    string(bl.Kind),
					Version: bl.Version,
					Scheme:  bl.Scheme,
				}))
			}

			// Do assessment for each workload container and also calculate the overall result.
			for _, ct := range containers {
				// Read data of the container image.
				aid := core.ParseArtifactIDFrom(ct.Image, ct.ImageID)
				stores, err := adapter.Read(ctx, aid, readOps...)
				if err != nil {
					if core.IsArtifactNotFoundError(err) {
						// request data if artifact not found
						reqErr := adapter.Request(ctx, aid)
						if reqErr != nil {
							log.Error(reqErr, "request data", "artifactID", aid)
						}
					}
					// Treat as failure so far.
					wa.Passed = false
					wa.Failures = append(wa.Failures, &v1alpha1.AssessmentFailure{
						Container: *ct,
						AssessmentError: v1alpha1.AssessmentError{
							Error: err.Error(),
							Cause: "Read security data error",
						},
					})

					continue
				}

				// Compliance checking now.
				for _, bl := range policy.Spec.Inspection.Baselines {
					// Data metadata.
					meta := core.Metadata{
						Kind:    string(bl.Kind),
						Version: bl.Version,
						Scheme:  bl.Scheme,
					}

					// Find the related data store from the store list.
					for _, store := range stores {
						if store.Metadata().Equal(meta) {
							// Check if match the compliance baseline.
							if err := store.Assess(*bl); err != nil {
								wa.Passed = false
								wa.Failures = append(wa.Failures, &v1alpha1.AssessmentFailure{
									Baseline:  bl,
									Container: *ct,
									AssessmentError: v1alpha1.AssessmentError{
										Error: err.Error(),
										Cause: "Compliance check failed",
									},
								})
							}

							break
						}
					}

					// If no data found for the relevant compliance baseline, treat it as success so far.
				}
			}

			return wa
		}
	}

	// Scan workload in parallel.
	pool := grpool.WithContext(ctx)
	pool.Start()
	defer pool.Close()

	if err := pool.Plan(len(nsl)); err != nil {
		log.Error(err, "plan queue size error")
		return err
	}

	inspect := inspectFac()

	for _, ns := range nsl {
		log.Info("Scan workloads under namespace", "namespace", ns)

		// Add namespace assessment to the report.
		na := &v1alpha1.NamespaceAssessment{
			Namespace: corev1.LocalObjectReference{
				Name: ns.Name,
			},
			WorkloadAssessments: make([]*v1alpha1.WorkloadAssessment, 0),
		}
		report.Spec.NamespaceAssessments = append(report.Spec.NamespaceAssessments, na)

		pool.Queue(func(nsAssessment *v1alpha1.NamespaceAssessment) grpool.Job {
			return func(ctx context.Context) <-chan error {
				ech := make(chan error, 1)
				defer close(ech)

				wls, err := c.scanner.ScanWorkloads(ctx, corev1.LocalObjectReference{Name: nsAssessment.Namespace.Name}, policy.Spec.Inspection.WorkloadSelector)
				if err != nil {
					ech <- err
					return ech
				}

				for _, wl := range wls {
					log.Info("Inspecting workload", "namespace", wl.Namespace, "name", wl.Name)

					wla := inspect(*wl)
					nsAssessment.WorkloadAssessments = append(nsAssessment.WorkloadAssessments, wla)
				}

				// No error need to be returned.
				return ech
			}
		}(na))
	}

	// Wait all are done.
	if err := pool.Wait(); err != nil {
		return err
	}

	// Enforce polices based on the generated report when necessary.
	if policy.Spec.Inspection.Actions != nil {
		if err := c.enforcePolicies(ctx, report, policy); err != nil {
			return errors.Wrap(err, "enforce policies")
		}
	}

	err2 := c.checkAndSendReportToGovernor(ctx, policy, report)
	log.Info("Calling governor exporter")
	if err2 != nil {
		return err2
	}

	// Create report CR if necessary.
	if policy.Spec.Inspection.Assessment.Generate {
		if err := c.kc.Create(ctx, report); err != nil {
			return errors.Wrap(err, "generate report")
		}
	}

	// Read config from InspectionPolicy, save assessment reports to ES if elasticsearch enabled.
	if policy.Spec.Inspection.Assessment.ElasticSearchEnabled {
		log.Info("Start saving to ES ", "namespace", nil)
		if err := exportReportToES(report, policy); err != nil {
			return err
		}
	}
	// Read config from InspectionPolicy, save assessment reports to OpenSearch if opensearch enabled.
	if policy.Spec.Inspection.Assessment.OpenSearchEnabled {
		if err := exportReportToOpenSearch(report, policy); err != nil {
			return err
		}
	}

	return nil
}

func (c *controller) checkAndSendReportToGovernor(ctx context.Context, policy *v1alpha1.InspectionPolicy, report *v1alpha1.AssessmentReport) error {
	// Read config from InspectionPolicy, send assessment reports to Governor api if governor enabled.
	if policy.Spec.Inspection.Assessment.Governor.Enabled {
		governorConfig := policy.Spec.Inspection.Assessment.Governor

		if governorConfig.ClusterID == "" || governorConfig.URL == "" || governorConfig.CspSecretName == "" {
			log.Error("Either ClusterID or URL or CSPSecretName is empty")
			return errors.New("Either ClusterID or URL or CSPSecretName is empty")
		}

		log.Info("Calling governor exporter")
		if exporterErr := exportReportToGovernor(ctx, report, policy); exporterErr != nil {
			log.Errorf("Error from exporter: %v", exporterErr)
			return exporterErr
		}
	}
	return nil
}

func exportReportToGovernor(ctx context.Context, report *v1alpha1.AssessmentReport, policy *v1alpha1.InspectionPolicy) error {
	governorConfig := policy.Spec.Inspection.Assessment.Governor

	// Create api client to governor api.
	config := openapi.NewConfiguration()
	config.Servers = openapi.ServerConfigurations{{
		URL: governorConfig.URL,
	}}
	apiClient := openapi.NewAPIClient(config)

	cspClient, err := cspauth.NewCspHTTPClient()
	if err != nil {
		log.Errorf("Initializing CSP : %v", err)
		return err
	}
	provider := &cspauth.CspAuth{CspClient: cspClient}

	clientSet, err := kubernetes.NewForConfig(ctrl.GetConfigOrDie())
	if err != nil {
		log.Error(err, "Failed to get kubernetes clientSet, check if kube config is correctly configured!")
		return err
	}

	exporter := governor.GovernorExporter{
		Report:        report,
		ClusterID:     governorConfig.ClusterID,
		ApiClient:     apiClient,
		CspProvider:   provider,
		KubeInterface: clientSet,
	}

	if apiResponseErr := exporter.SendReportToGovernor(ctx); apiResponseErr != nil {
		log.Error("Err response from governor exporter", apiResponseErr)
		return apiResponseErr
	}

	return nil
}

func exportReportToOpenSearch(report *v1alpha1.AssessmentReport, policy *v1alpha1.InspectionPolicy) error {
	openSearchClient := osearch.NewClient([]byte{},
		policy.Spec.Inspection.Assessment.OpenSearchAddr,
		policy.Spec.Inspection.Assessment.OpenSearchUser,
		policy.Spec.Inspection.Assessment.OpenSearchPasswd)
	if openSearchClient == nil {
		log.Info("OpenSearch openSearchClient is nil")
	}
	exporter := osearch.OpenSearchExporter{Client: openSearchClient}
	err := exporter.NewExporter(openSearchClient, "assessment_report")
	if err != nil {
		return err
	}
	if err := exporter.Save(*report); err != nil {
		return err
	}
	return nil
}

func exportReportToES(report *v1alpha1.AssessmentReport, policy *v1alpha1.InspectionPolicy) error {
	cert := []byte(policy.Spec.Inspection.Assessment.ElasticSearchCert)

	type args struct {
		cert     []byte
		addr     string
		username string
		passwd   string
	}
	// password: kubectl get secret instanceName-es-elastic-user -o go-template='{{.data.elastic | base64decode}}'
	clientArgs := args{
		cert,
		policy.Spec.Inspection.Assessment.ElasticSearchAddr,
		policy.Spec.Inspection.Assessment.ElasticSearchUser,
		policy.Spec.Inspection.Assessment.ElasticSearchPasswd,
	}
	log.Info("ES config: ", "addr", clientArgs.addr)
	log.Info("ES config: ", "clientArgs.username", clientArgs.username)
	esClient := es.NewClient(clientArgs.cert, clientArgs.addr, clientArgs.username, clientArgs.passwd)
	if esClient == nil {
		log.Info("ES esClient is nil")
	}

	if err := es.TestClient(); err != nil {
		log.Info("esClient test error")
		return err
	}
	exporter := es.ElasticSearchExporter{Client: esClient}
	err := exporter.NewExporter(esClient, "assessment_report")
	if err != nil {
		return err
	}

	if err := exporter.Save(*report); err != nil {
		return err
	}
	return nil
}

func (c *controller) enforcePolicies(ctx context.Context, report *v1alpha1.AssessmentReport, pl *v1alpha1.InspectionPolicy) error {
	for _, act := range pl.Spec.Inspection.Actions {
		// Get enforcer first.
		enforcer, err := policy.GetEnforcer(
			act.Kind,
			policy.UseClient(c.kc),
			policy.WithScheme(c.scheme))
		if err != nil {
			// Log error and continue.
			log.Error(err, "get enforcer", "enforcer", act)
			continue
		}

		// Loop all the workloads and do enforcement.
		for _, nsa := range report.Spec.NamespaceAssessments {
			for _, wla := range nsa.WorkloadAssessments {
				// Has it been enforced before?
				managed, err := enforcer.IsManaged(ctx, &wla.Workload)
				if err != nil {
					// Just logged for easy troubleshooting.
					log.Error(err, "check if workload has been enforced the policy action", "workload", wla.Workload, "action", act)
				}

				if !wla.Passed {
					aef := &v1alpha1.FollowupActionEnforcement{
						Action: *act,
						Result: v1alpha1.EnforcementResult{
							Status: v1alpha1.EnforcementStatusApplied,
						},
					}

					// Enforce related policies.
					if !managed {
						if err := enforcer.Enforce(ctx, &wla.Workload, enforcement.WithGeneralSettings(act.Settings)); err != nil {
							e := errors.Wrap(err, "enforce policy").Error()
							aef.Result.Status = v1alpha1.EnforcementStatusFailed
							aef.Result.Error = &e
						}
					}

					// Append.
					wla.ActionEnforcements = append(wla.ActionEnforcements, aef)
				} else {
					if managed {
						if err := enforcer.Revoke(ctx, &wla.Workload); err != nil {
							e := errors.Wrap(err, "revoke policy").Error()
							// Append result.
							aef := &v1alpha1.FollowupActionEnforcement{
								Action: *act,
								Result: v1alpha1.EnforcementResult{
									Status: v1alpha1.EnforcementStatusDirty,
									Error:  &e,
								},
							}

							// Append.
							wla.ActionEnforcements = append(wla.ActionEnforcements, aef)
						}
					}
				}
			}
		}
	}

	return nil
}
