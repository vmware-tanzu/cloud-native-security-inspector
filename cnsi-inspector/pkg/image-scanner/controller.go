// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package image_scanner

import (
	"context"
	"encoding/json"
	exporter_inputs "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-exporter/pkg/inputs"
	itypes "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg"
	wl "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/assets/workload"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/policy/enforcement"
	"github.com/vmware-tanzu/cloud-native-security-inspector/lib/log"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"time"

	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/policy"

	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/cspauth"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/data"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/data/core"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/data/providers"
	vac_provider "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/data/vacprovider"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/runtime/grpool"
	governor_client "github.com/vmware-tanzu/cloud-native-security-inspector/lib/governor/go-client"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
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

	collector wl.Collector
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
	c.collector = wl.NewCollector().
		WithScheme(c.scheme).
		UseClient(c.kc).
		Complete()

	// Mark controller is ready.
	c.ready = true

	return c
}

func (c *controller) GetVacAdapter(setting *v1alpha1.Setting) (*vac_provider.Adapter, error) {

	config := governor_client.NewConfiguration()
	config.Servers = governor_client.ServerConfigurations{{
		URL: setting.Spec.VacDataSource.Endpoint,
	}}
	apiClient := governor_client.NewAPIClient(config)

	cspClient, err := cspauth.NewCspHTTPClient()
	if err != nil {
		log.Errorf("Initializing CSP : %v", err)
		return nil, err
	}
	provider := &cspauth.CspAuth{CspClient: cspClient}

	clientSet, err := kubernetes.NewForConfig(ctrl.GetConfigOrDie())
	if err != nil {
		log.Error(err, "Failed to get kubernetes clientSet, check if kube config is correctly configured!")
		return nil, err
	}
	adapter := &vac_provider.Adapter{
		ApiClient:          apiClient,
		CspProvider:        provider,
		KubeInterface:      clientSet,
		CspSecretName:      setting.Spec.VacDataSource.CredentialRef.Name,
		CspSecretNamespace: setting.Spec.VacDataSource.CredentialRef.Namespace,
	}
	return adapter, nil
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

	// if VacAssessment Enabled,
	if policy.Spec.VacAssessmentEnabled {
		if setting.Spec.VacDataSource.Endpoint == "" {
			log.Error("Invalid VacDataSource endpoint in setting")
			return nil, errors.New("Invalid VacDataSource in setting")
		}

		if setting.Spec.VacDataSource.CredentialRef == nil ||
			setting.Spec.VacDataSource.CredentialRef.Name == "" ||
			setting.Spec.VacDataSource.CredentialRef.Namespace == "" {
			log.Error("Invalid VacDataSource CredentialRef in setting")
			return nil, errors.New("Invalid VacDataSource in setting")
		}
	}

	// if data source is disabled, return error.
	if setting.Spec.DataSource.Disabled {
		log.Info("The data source in settings is disabled")
		return nil, errors.New("Data source in settings is disabled!")
	}

	return setting, nil

}

func (c *controller) convertProductToVacProductInfo(product *governor_client.Product) *wl.VacProductInfo {
	vacProductInfo := &wl.VacProductInfo{}

	if product == nil {
		vacProductInfo := &wl.VacProductInfo{}
		vacProductInfo.Trusted = false
		return vacProductInfo
	}

	vacProductInfo.Trusted = true
	vacProductInfo.Name = &product.Name
	vacProductInfo.Branch = &product.Branch
	vacProductInfo.Version = &product.Version
	vacProductInfo.Revision = product.Revision
	vacProductInfo.ReleasedAt = &product.ReleasedAt
	vacProductInfo.LastVersionReleased = product.LastVersionReleased
	vacProductInfo.Status = product.Status

	if product.DeprecationPolicy != nil {
		deprecationPolicy := &wl.DeprecationPolicy{}
		deprecationPolicy.DeprecationDate = product.DeprecationPolicy.DeprecationDate
		deprecationPolicy.GracePeriodDays = product.DeprecationPolicy.GracePeriodDays
		deprecationPolicy.Reason = product.DeprecationPolicy.Reason
		deprecationPolicy.Alternative = product.DeprecationPolicy.Alternative
		vacProductInfo.DeprecationPolicy = deprecationPolicy
	}

	if product.NonsupportPolicy != nil {
		nonSupportPolicy := &wl.NonSupportPolicy{}
		nonSupportPolicy.Name = product.NonsupportPolicy.Name
		nonSupportPolicy.Reason = product.NonsupportPolicy.Reason
		vacProductInfo.NonsupportPolicy = nonSupportPolicy
	}
	return vacProductInfo
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

	nsl, err := c.collector.CollectNamespaces(ctx, policy.Spec.Inspection.NamespaceSelector, skips)
	if err != nil {
		return errors.Wrap(err, "scan namespaces")
	}

	// Nothing to handle
	// Just in case.
	if len(nsl) == 0 {
		log.Info("no namespaces found")
		return nil
	}

	// Assessment report.
	timeNow := time.Now().Format(time.RFC3339)
	report := itypes.AssessmentReport{
		TimeStamp:            timeNow,
		DocID:                "image-report-" + timeNow,
		NamespaceAssessments: make([]*itypes.NamespaceAssessment, 0),
	}

	// GetVacAdapter
	var vacAdapter *vac_provider.Adapter
	if policy.Spec.VacAssessmentEnabled {
		vacAdapter, err = c.GetVacAdapter(setting)
		if err != nil {
			return err
		}
	}

	// Use closure to warp the related parameters.
	inspectFac := func() func(workload wl.Workload) *itypes.WorkloadAssessment {
		return func(workload wl.Workload) *itypes.WorkloadAssessment {
			// Single pod
			if workload.Name == "" && len(workload.Pods) == 1 {
				workload.Name = workload.Pods[0].Name
				workload.Kind = "Pod"
				workload.APIVersion = workload.Pods[0].APIVersion
			}

			wa := &itypes.WorkloadAssessment{
				Workload: workload,
				Passed:   true,
			}

			// Go through the pods of the workload.
			// Collect all the container (images).
			var containers []*wl.Container
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

				// Get VacAssessment
				if policy.Spec.VacAssessmentEnabled {
					productInfo, err := vacAdapter.GetVacProductInfo(ct.ImageID)
					if err != nil {
						log.Error("VAC Product Assessment Failed")
					} else {
						ct.VacAssessment = c.convertProductToVacProductInfo(productInfo)
					}
				} else {
					log.Info("Skipping VAC Assessment")
				}
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
					wa.Failures = append(wa.Failures, &itypes.AssessmentFailure{
						Container: *ct,
						AssessmentError: itypes.AssessmentError{
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
								wa.Failures = append(wa.Failures, &itypes.AssessmentFailure{
									Baseline:  *bl,
									Container: *ct,
									AssessmentError: itypes.AssessmentError{
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
		na := &itypes.NamespaceAssessment{
			Namespace: corev1.LocalObjectReference{
				Name: ns.Name,
			},
			WorkloadAssessments: make([]*itypes.WorkloadAssessment, 0),
		}
		report.NamespaceAssessments = append(report.NamespaceAssessments, na)

		pool.Queue(func(nsAssessment *itypes.NamespaceAssessment) grpool.Job {
			return func(ctx context.Context) <-chan error {
				ech := make(chan error, 1)
				defer close(ech)

				wls, err := c.collector.CollectWorkloads(ctx, corev1.LocalObjectReference{Name: nsAssessment.Namespace.Name}, policy.Spec.Inspection.WorkloadSelector)
				if err != nil {
					ech <- err
					return ech
				}

				for _, wl := range wls {
					log.Info("Inspecting workload", "namespace", wl.Namespace, "name", wl.Name)
					wla := inspect(*wl)
					nsAssessment.WorkloadAssessments = append(nsAssessment.WorkloadAssessments, wla)
					if policy.Spec.Inspection.Actions != nil {
						if wla.Passed {
							c.revokeActionIfNeed(ctx, wl, policy)
						} else {
							c.enforceActionIfNeed(ctx, wl, policy)
						}
					}
				}
				return ech
			}
		}(na))
	}

	// Wait all are done.
	if err := pool.Wait(); err != nil {
		return err
	}

	ExportImageReports(report, policy)

	return nil
}

func (c *controller) enforceActionIfNeed(ctx context.Context, wl *wl.Workload, pl *v1alpha1.InspectionPolicy) {
	// In this function we only report err in the log, but don't break the main stream
	for _, act := range pl.Spec.Inspection.Actions {
		enforcer, err := policy.GetEnforcer(
			act.Kind,
			policy.UseClient(c.kc),
			policy.WithScheme(c.scheme))
		if err != nil {
			log.Error(err, "failed to get enforcer", "workload", wl, "action", act)
			continue
		}
		hasBeenEnforced, err := enforcer.HasBeenEnforced(ctx, wl)
		if err != nil {
			log.Error(err, "failed to check if the workload has been enforced by the policy", "workload", wl, "action", act)
			continue
		}
		if hasBeenEnforced {
			continue
		}
		if err := enforcer.Enforce(ctx, wl, enforcement.WithGeneralSettings(act.Settings)); err != nil {
			log.Error(err, "failed to enforce an action", "workload", wl, "action", act)
		}
	}
}

func (c *controller) revokeActionIfNeed(ctx context.Context, wl *wl.Workload, pl *v1alpha1.InspectionPolicy) {
	// In this function we only report err in the log, but don't break the main stream
	for _, act := range pl.Spec.Inspection.Actions {
		enforcer, err := policy.GetEnforcer(
			act.Kind,
			policy.UseClient(c.kc),
			policy.WithScheme(c.scheme))
		if err != nil {
			log.Error(err, "failed to get enforcer", "workload", wl, "action", act)
			continue
		}
		hasBeenEnforced, err := enforcer.HasBeenEnforced(ctx, wl)
		if err != nil {
			log.Error(err, "failed to check if the workload has been enforced by the policy", "workload", wl, "action", act)
			continue
		}
		if !hasBeenEnforced {
			continue
		}
		if err := enforcer.Revoke(ctx, wl); err != nil {
			log.Error(err, "failed to revoke an action", "workload", wl, "action", act)
		}
	}
}

func ExportImageReports(report itypes.AssessmentReport, pl *v1alpha1.InspectionPolicy) {
	if bytes, err := json.Marshal(report); err != nil {
		// Marshal failure should be fatal because it is unforgivable
		log.Fatal(err, "failed to marshal the insight struct")
	} else {
		exportStruct := &v1alpha1.ReportData{
			Source:       "insight_report",
			ExportConfig: pl.Spec.Inspector.ExportConfig,
			Payload:      string(bytes),
		}
		err = exporter_inputs.PostReport(exportStruct)
		if err != nil {
			// Post failure is error because network issues could happen
			log.Error(err, "failed to post the insight report", "Policy", pl.Name)
		}
	}
}
