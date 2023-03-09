// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package pkg

import (
	"context"
	"encoding/json"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	wl "github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/assets/workload"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	exporter_inputs "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/exporter/inputs"
	itypes "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspectors/imagescanner/types"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/runtime/grpool"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
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

// Run implements Controller.
func (c *controller) Run(ctx context.Context, policy *v1alpha1.InspectionPolicy) error {
	log.Info("In inspection controller...")
	if policy == nil {
		return errors.New("empty inspection policy config to runtime")
	}

	if !c.ready {
		return errors.New("controller is not ready: use CTRL() to init controller ")
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
	report := itypes.AssessmentReport{
		NamespaceAssessments: make([]*itypes.NamespaceAssessment, 0),
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

func ExportImageReports(report itypes.AssessmentReport, pl *v1alpha1.InspectionPolicy) {
	if bytes, err := json.Marshal(report); err != nil {
		// Marshal failure should be fatal because it is unforgivable
		log.Fatal(err, "failed to marshal the insight struct")
	} else {
		exportStruct := &v1alpha1.ReportData{
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
