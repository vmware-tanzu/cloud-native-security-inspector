// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package controllers

import (
	"context"
	"time"

	"github.com/goharbor/harbor/src/lib/errors"
	goharborv1alpha1 "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/providers"
	"k8s.io/apimachinery/pkg/api/equality"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// SettingReconciler reconciles a Setting object
type SettingReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=settings,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=settings/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=settings/finalizers,verbs=update
//+kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch;delete

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
// TODO(user): Modify the Reconcile function to compare the state specified by
// the Inspection object against the actual cluster state, and then
// perform operations to make the cluster state reflect the state specified by
// the user.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.8.3/pkg/reconcile
func (r *SettingReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log.Info("Reconciling")

	setting := &goharborv1alpha1.Setting{}
	if err := r.Get(ctx, req.NamespacedName, setting); err != nil {
		if !apierrors.IsNotFound(err) {
			log.Error(err, "unable to get setting")
		}
		// Ignore the not found error.
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if !setting.DeletionTimestamp.IsZero() {
		log.Info("Skip reconcile because setting has the deletionTimestamp")
		// Exit gracefully and no clean up needed.
		return ctrl.Result{}, nil
	}

	// if data source is disabled, skip reconcile
	if setting.Spec.DataSource.Disabled {
		log.Info("Skip reconcile because the data source is disabled")
		return ctrl.Result{}, nil
	}

	settingCopy := setting.DeepCopy()
	// initializes status
	if len(setting.Status.Status) == 0 {
		settingCopy.Status.Status = goharborv1alpha1.SettingStatusUnknown
	}
	// get data source provider
	provider, err := providers.NewProvider(ctx, r.Client, setting)
	if err != nil {
		log.Error(err, "failed to create provider")
		return ctrl.Result{}, errors.Wrap(err, "new provider error")
	}
	// data source health check
	if err = r.checkDataSource(ctx, provider, settingCopy); err != nil {
		log.Error(err, "failed to check data source health")
	}
	// ensure known registries
	if err = r.ensureKnownRegistries(ctx, provider, settingCopy); err != nil {
		log.Error(err, "failed to ensure known registries")
	}
	// apply config
	if err = r.applyConfig(ctx, provider, settingCopy); err != nil {
		log.Error(err, "failed to apply config")
	}
	// update status if changed
	if !equality.Semantic.DeepEqual(setting.Status, settingCopy.Status.AggregateStatus()) {
		if err = r.Client.Status().Update(ctx, settingCopy); err != nil {
			return ctrl.Result{}, errors.Wrap(err, "update status error")
		}
		log.Info("Updated status", "status", settingCopy.Status)
	}

	log.Info("Reconcile completed")
	return ctrl.Result{}, nil
}

// checkDataSource checks data source health.
func (r *SettingReconciler) checkDataSource(ctx context.Context, p providers.Adapter, set *goharborv1alpha1.Setting) error {
	cond := set.Status.GetCondition(goharborv1alpha1.ConditionTypeDataSourceReady)
	if cond == nil {
		cond = &goharborv1alpha1.Condition{
			Type:   goharborv1alpha1.ConditionTypeDataSourceReady,
			Status: goharborv1alpha1.ConditionStatusUnknown,
		}
	}

	defer set.Status.SetCondition(cond)
	// ping data source
	err := p.Ping(ctx)
	if err != nil {
		if !cond.IsFalse() {
			cond.Status = goharborv1alpha1.ConditionStatusFalse
			cond.LastTransitionTime = &metav1.Time{Time: time.Now()}
			cond.Message = errors.Errorf("ping data source error: %s", err).Error()
		}
	} else {
		// ping success
		if !cond.IsTrue() {
			cond.Status = goharborv1alpha1.ConditionStatusTrue
			cond.LastTransitionTime = &metav1.Time{Time: time.Now()}
			cond.Message = ""
		}
	}

	return err
}

// ensureKnownRegistries ensures known registries have been registered to data
// source.
func (r *SettingReconciler) ensureKnownRegistries(ctx context.Context, p providers.Adapter, set *goharborv1alpha1.Setting) error {
	cond := set.Status.GetCondition(goharborv1alpha1.ConditionTypeKnownRegistryRegistered)
	if cond == nil {
		cond = &goharborv1alpha1.Condition{
			Type:   goharborv1alpha1.ConditionTypeKnownRegistryRegistered,
			Status: goharborv1alpha1.ConditionStatusUnknown,
		}
	}

	defer set.Status.SetCondition(cond)
	// register known registries, create or update
	if set.Spec.KnownRegistries == nil || len(set.Spec.KnownRegistries) == 0 {
		log.Info("there is no configuration about known registries in the setting")
		// we should set this to true because a setting without the known registry configuration should be healthy
		cond.Status = goharborv1alpha1.ConditionStatusTrue
		return nil
	}
	err := p.RegisterKnownRegistries(ctx, set.Spec.KnownRegistries)
	if err != nil {
		if !cond.IsFalse() {
			cond.Status = goharborv1alpha1.ConditionStatusFalse
			cond.LastTransitionTime = &metav1.Time{Time: time.Now()}
			cond.Message = errors.Errorf("register known registries error: %s", err).Error()
		}
	} else {
		// register success
		if !cond.IsTrue() {
			cond.Status = goharborv1alpha1.ConditionStatusTrue
			cond.LastTransitionTime = &metav1.Time{Time: time.Now()}
			cond.Message = ""
		}
	}

	return err
}

// applyConfig applies config to data source.
func (r *SettingReconciler) applyConfig(ctx context.Context, p providers.Adapter, set *goharborv1alpha1.Setting) error {
	cond := set.Status.GetCondition(goharborv1alpha1.ConditionTypeApplyConfigReady)
	if cond == nil {
		cond = &goharborv1alpha1.Condition{
			Type:   goharborv1alpha1.ConditionTypeApplyConfigReady,
			Status: goharborv1alpha1.ConditionStatusUnknown,
		}
	}

	defer set.Status.SetCondition(cond)
	// apply config
	err := p.ApplyConfig(ctx, set.Spec.DataSource)
	if err != nil {
		if !cond.IsFalse() {
			cond.Status = goharborv1alpha1.ConditionStatusFalse
			cond.LastTransitionTime = &metav1.Time{Time: time.Now()}
			cond.Message = errors.Errorf("apply setting error: %s", err).Error()
		}
	} else {
		// apply success
		if !cond.IsTrue() {
			cond.Status = goharborv1alpha1.ConditionStatusTrue
			cond.LastTransitionTime = &metav1.Time{Time: time.Now()}
			cond.Message = ""
		}
	}

	return err
}

// SetupWithManager sets up the controller with the Manager.
func (r *SettingReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&goharborv1alpha1.Setting{}).
		Complete(r)
}
