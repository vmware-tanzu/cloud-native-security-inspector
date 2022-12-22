// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package controllers

import (
	"context"
	"strconv"
	"time"

	"github.com/pkg/errors"

	cnsiv1alpha1 "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	regularLoop = 5 * time.Minute
)

// AssessmentReportReconciler reconciles a AssessmentReport object
type AssessmentReportReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=assessmentreports,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=assessmentreports/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=assessmentreports/finalizers,verbs=update

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
// TODO(user): Modify the Reconcile function to compare the state specified by
// the AssessmentReport object against the actual cluster state, and then
// perform operations to make the cluster state reflect the state specified by
// the user.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.8.3/pkg/reconcile
func (r *AssessmentReportReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log.Info("Reconcile assessment report", "resource", req.NamespacedName)

	// First get the assessment report.
	report := &cnsiv1alpha1.AssessmentReport{}
	if err := r.Client.Get(ctx, client.ObjectKey{
		Namespace: req.Namespace,
		Name:      req.Name,
	}, report); err != nil {
		// Resource has been deleted.
		if apierrors.IsNotFound(err) {
			log.Info("Reconcile completed.")
			return ctrl.Result{}, nil
		}

		log.Error(err, "get assessment report")
		return ctrl.Result{}, err
	}

	// Check if it is being deleted.
	if !report.DeletionTimestamp.IsZero() {
		return ctrl.Result{}, nil
	}

	// Check live time one by one.
	// Get owner reference.
	// If no owner reference existing, treat it as invalid one.
	skipped := true
	policy := &cnsiv1alpha1.InspectionPolicy{}
	if owner, ok := report.Annotations[cnsiv1alpha1.OwnerReferenceAnnotation]; ok {
		// Get inspection policy here.
		if err := r.Client.Get(ctx, client.ObjectKey{Name: owner}, policy); err != nil {
			log.Error(err, "get inspection policy owner")
			return ctrl.Result{}, err
		}

		// Check creation timestamp.
		if timestamp, ok := report.Annotations[cnsiv1alpha1.CreationTimestampAnnotation]; ok {
			// All the related annotations are existing.
			skipped = false

			unixT, err := strconv.ParseInt(timestamp, 10, 64)
			if err != nil {
				log.Error(err, "parse creation timestamp")
				return ctrl.Result{}, errors.Wrap(err, "parse creation timestamp")
			}

			liveTime := time.Duration(policy.Spec.Inspection.Assessment.LiveTime) * time.Second
			if time.Unix(unixT, 0).UTC().Add(liveTime).Before(time.Now().UTC()) {
				// Discard dirty report.
				if err := r.Client.Delete(ctx, report); err != nil {
					log.Error(err, "delete dirty assessment report")
					return ctrl.Result{}, err
				}

				// Finished
				return ctrl.Result{}, nil
			}
		}
	}

	if skipped {
		log.Info("Skip assessment report because of missing required annotations")
		return ctrl.Result{}, nil
	}

	nextSlot := regularLoop
	lv := time.Duration(policy.Spec.Inspection.Assessment.LiveTime) * time.Second
	if nextSlot > lv {
		nextSlot = lv
	}

	log.Info("Reconcile later again", "next time", time.Now().UTC().Add(nextSlot))
	return ctrl.Result{
		RequeueAfter: nextSlot,
	}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *AssessmentReportReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&cnsiv1alpha1.AssessmentReport{}).
		Complete(r)
}
