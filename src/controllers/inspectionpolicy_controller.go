// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package controllers

import (
	"context"
	"fmt"
	"github.com/goharbor/harbor/src/jobservice/logger"
	"strings"

	"github.com/go-logr/logr"
	"github.com/pkg/errors"
	goharborv1 "github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	batchv1 "k8s.io/api/batch/v1"
	batchv1beta1 "k8s.io/api/batch/v1beta1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/json"
	"k8s.io/apiserver/pkg/storage/names"
	"k8s.io/client-go/tools/reference"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

const (
	defaultImage          = "projects.registry.vmware.com/cnsi/inspector"
	defaultImageTag       = "0.1"
	labelOwnerKey         = "goharbor.io/policy-working-for"
	lastAppliedAnnotation = "goharbor.io/last-applied-spec"
)

// InspectionPolicyReconciler reconciles a InspectionPolicy object
type InspectionPolicyReconciler struct {
	client.Client
	Scheme *runtime.Scheme
	logger logr.Logger
}

//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=inspectionpolicies,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=inspectionpolicies/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=inspectionpolicies/finalizers,verbs=update
//+kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterroles,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterrolebindings,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="",resources=serviceaccounts,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="batch",resources=cronjobs,verbs=get;list;watch;create;update;patch;delete

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.8.3/pkg/reconcile
func (r *InspectionPolicyReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx).
		WithName("InspectionPolicyReconciler").
		WithValues("policy", req.NamespacedName)
	// For sub functions usage.
	r.logger = logger

	logger.Info("Reconciling inspector policy")

	// First, get the inspector policy.
	policy := &goharborv1.InspectionPolicy{}
	if err := r.Get(ctx, req.NamespacedName, policy); err != nil {
		if !apierrors.IsNotFound(err) {
			logger.Error(err, "unable to get inspection policy")
		}
		// Ignore the not found error.
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// Deleting...
	if !policy.DeletionTimestamp.IsZero() {
		logger.Info("inspector is disabled as policy is being deleted", "policy", req.NamespacedName)
		// Exit gracefully and no clean up needed.
		return ctrl.Result{}, nil
	}

	// Ensure the work namespace is there.
	wns, err := r.ensureWorkNamespace(ctx, policy)
	if err != nil {
		logger.Error(err, "unable to ensure the work namespace")
		return ctrl.Result{}, err
	}
	logger.V(1).Info("Ensure work namespace", "namespace", wns)

	// For further usage.
	policy.Spec.WorkNamespace = wns

	// Ensure Setting is correctly configured.
	datasource, err := r.EnsureSettings(ctx, policy)
	if err != nil {
		logger.Error(err, "unable to ensure the settings in inspection policy")
		return ctrl.Result{}, err
	}
	logger.V(1).Info("Ensure settings in inspection policy", "datasource in settings", datasource)

	// Ensure RBAC is correctly configured.
	if err := r.ensureRBAC(ctx, *wns); err != nil {
		logger.Error(err, "ensure RBAC of inspector")
		return ctrl.Result{}, err
	}

	// Check whether the underlying cronjob resource is existing or not.
	cj, err := r.checkCronJob(ctx, policy)
	if err != nil {
		logger.Error(err, "unable to check underlying cron job")
		return ctrl.Result{}, err
	}

	if cj != nil {
		logger.V(1).Info("Found underlying cronjob existing", "cronjob", cj)
	}

	cjCR, err := r.generateCronJobCR(policy)
	if err != nil {
		logger.Error(err, "unable to generate underlying cronjob CR")
		return ctrl.Result{}, err
	}

	statusNeedUpdate := false
	// Create new when cronjob is not existing.
	if cj == nil {
		logger.V(1).Info("Create underlying cronjob")

		if err := r.Client.Create(ctx, cjCR); err != nil {
			logger.Error(err, "unable to create underlying cronjob", "cronjob", cjCR)
			return ctrl.Result{}, err
		}

		// Retrieve again for further usage?
		var ncj batchv1beta1.CronJob
		if err := r.Client.Get(ctx, client.ObjectKey{
			Namespace: cjCR.Namespace,
			Name:      cjCR.Name,
		}, &ncj); err != nil {
			logger.Error(err, "unable to retrieve the newly created underlying cronjob")
			return ctrl.Result{}, err
		}

		cj = &ncj
	} else {
		// Any changes?
		if r.changed(cj, cjCR) {
			logger.V(1).Info("Update underlying cronjob")

			statusNeedUpdate = *cj.Spec.Suspend != *cjCR.Spec.Suspend

			cj.Spec = cjCR.DeepCopy().Spec
			if err := r.Client.Update(ctx, cj); err != nil {
				logger.Error(err, "unable to update underlying cronjob", "cronjob", cj)
				return ctrl.Result{}, err
			}
		}
	}

	// Ensure executor reference is set.
	if policy.Status.Executor == nil {
		if cj != nil {
			// Add reference.
			ref, err := reference.GetReference(r.Scheme, cj)
			if err != nil {
				logger.Error(err, "unable to get reference of underlying cronjob", "cronjob", cj)
				return ctrl.Result{}, err
			}

			policy.Status.Executor = ref
			statusNeedUpdate = true
		}
	}

	// Update the policy status when necessary.
	r.updatePolicyStatus(policy, statusNeedUpdate, ctx)
	if err != nil {
		return ctrl.Result{}, err
	}
	logger.Info("Reconcile completed")
	return ctrl.Result{}, nil
}

func (r *InspectionPolicyReconciler) updatePolicyStatus(policy *goharborv1.InspectionPolicy,
	statusNeedUpdate bool, ctx context.Context) error {
	if statusNeedUpdate || len(policy.Status.Status) == 0 {
		policy.Status.Status = goharborv1.PolicyStandby
		if *policy.Spec.Strategy.Suspend {
			policy.Status.Status = goharborv1.PolicySuspend
		}
		logger.Info("Update status of inspection policy", "status", policy.Status.Status)

		if err := r.Status().Update(ctx, policy); err != nil {
			logger.Error(err, "failed to update status of inspection policy")
			return err
		}
	}
	return nil
}

func (r *InspectionPolicyReconciler) doKubeBench() error {

	return nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *InspectionPolicyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&goharborv1.InspectionPolicy{}).
		Complete(r)
}

// changed indicates if the resource has changed.
func (r *InspectionPolicyReconciler) changed(current *batchv1beta1.CronJob, now *batchv1beta1.CronJob) bool {
	cur := current.Annotations[lastAppliedAnnotation]
	n := now.Annotations[lastAppliedAnnotation]

	return n != cur && n != ""
}

func (r *InspectionPolicyReconciler) EnsureSettings(ctx context.Context, policy *goharborv1.InspectionPolicy) (*goharborv1.DataSource, error) {
	settingsName := policy.Spec.SettingsName
	if settingsName == "" {
		return nil, errors.New("Invalid settings name")
	}
	setting := &goharborv1.Setting{}
	namespaced := types.NamespacedName{
		Name: settingsName,
	}
	if err := r.Get(ctx, namespaced, setting); err != nil {
		if !apierrors.IsNotFound(err) {
			r.logger.Error(err, "unable to get setting")
		}
		return nil, err
	}
	// if data source is disabled, return error.
	if setting.Spec.DataSource.Disabled {
		r.logger.Info("The data source in settings is disabled")
		return nil, errors.New("Data source in settings is disabled!")
	}

	return &setting.Spec.DataSource, nil

}

func (r *InspectionPolicyReconciler) ensureWorkNamespace(ctx context.Context, policy *goharborv1.InspectionPolicy) (*string, error) {
	ns := policy.Spec.WorkNamespace
	if ns == nil {
		ns = &policy.Name
	}

	// Get the namespace resource.
	var namespace corev1.Namespace
	err := r.Client.Get(ctx, client.ObjectKey{Name: *ns}, &namespace)
	// No error, return now.
	// For none NOTFOUND error, directly return.
	// For NOTFOUND error, if the work namespace has been set, error should also been returned.
	if err == nil || !apierrors.IsNotFound(err) || policy.Spec.WorkNamespace != nil {
		return ns, err
	}

	// Create namespace now with policy name and set the workNamespace.
	newOne := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: policy.Name,
			Labels: map[string]string{
				labelOwnerKey: policy.Name,
			},
		},
	}
	if err := ctrl.SetControllerReference(policy, newOne, r.Scheme); err != nil {
		return nil, err
	}

	// Conflict error might occur.
	return ns, r.Client.Create(ctx, newOne)
}

// Make sure the service account for running inspection has the correct role in the work namespace.
const (
	saName          = "cnsi-inspector"
	roleBindingName = "cnsi-inspector-rolebinding"
	roleName        = "cnsi-manager-role"
)

func (r *InspectionPolicyReconciler) ensureRBAC(ctx context.Context, ns string) error {
	// Check cluster role first.
	// If it is not existing, then return error.
	crole := &rbacv1.ClusterRole{}
	if err := r.Client.Get(ctx, client.ObjectKey{
		Name: roleName,
	}, crole); err != nil {
		return errors.Wrapf(err, "get cluster role: %s", roleName)
	}

	// Check if the service account is existing.
	sa := &corev1.ServiceAccount{}
	if err := r.Client.Get(ctx, client.ObjectKey{
		Namespace: ns,
		Name:      saName,
	}, sa); err != nil {
		if !apierrors.IsNotFound(err) {
			return errors.Wrapf(err, "get specified service account %s:%s", ns, saName)
		}

		// Create a new one.
		sa.Namespace = ns
		sa.Name = saName
		if err := r.Client.Create(ctx, sa); err != nil {
			return errors.Wrapf(err, "create service account %s:%s", ns, saName)
		}
	}

	// Make sure the role binding is existing
	crb := &rbacv1.ClusterRoleBinding{}
	if err := r.Client.Get(ctx, client.ObjectKey{
		Name: roleBindingName,
	}, crb); err != nil {
		if !apierrors.IsNotFound(err) {
			return errors.Wrapf(err, "get cluster rolebinding: %s", roleBindingName)
		}

		// Create it.
		ncrb := &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name: roleBindingName,
			},
			RoleRef: rbacv1.RoleRef{
				APIGroup: crole.APIVersion[:strings.LastIndex(crole.APIVersion, "/")],
				Kind:     crole.Kind,
				Name:     crole.Name,
			},
			Subjects: []rbacv1.Subject{
				{
					Kind:      sa.Kind,
					Namespace: ns,
					Name:      saName,
				},
			},
		}

		if err := r.Client.Create(ctx, ncrb); err != nil {
			return errors.Wrapf(err, "create cluster role binding: %s", roleBindingName)
		}
	}

	return nil
}

func (r *InspectionPolicyReconciler) checkCronJob(ctx context.Context, policy *goharborv1.InspectionPolicy) (*batchv1beta1.CronJob, error) {
	exec := policy.Status.Executor
	if exec == nil {
		// Try to list it.
		var jl batchv1beta1.CronJobList
		if err := r.List(ctx, &jl, client.MatchingLabels{labelOwnerKey: policy.Name}); err != nil {
			return nil, err
		}

		// Nothing found.
		if len(jl.Items) == 0 {
			return nil, nil
		}

		// Duplicated?
		if len(jl.Items) > 1 {
			// Clean up?
			var mostRecent *batchv1beta1.CronJob
			for _, cj := range jl.Items {
				if mostRecent == nil {
					mostRecent = &cj
					continue
				}
				// Comparison.
				if mostRecent.CreationTimestamp.Before(&cj.CreationTimestamp) {
					// Delete the old one first.
					// Try best action.
					if err := r.Delete(ctx, mostRecent); err != nil {
						r.logger.Error(err, "unable to clean the duplicated old underlying cron job", "cronjob", mostRecent)
					}
					mostRecent = &cj
				}
			}

			return mostRecent, nil
		}

		return &jl.Items[0], nil
	}

	// Get the cron job and check if it is still existing.
	nsName := types.NamespacedName{
		Namespace: exec.Namespace,
		Name:      exec.Name,
	}

	var cronJob batchv1beta1.CronJob
	if err := r.Client.Get(ctx, nsName, &cronJob); err != nil {
		r.logger.Error(err, "unable to get the underlying cronjob", "cronjob", nsName)
		// Ignore the NOTFOUND error.
		return nil, client.IgnoreNotFound(err)
	}

	return &cronJob, nil
}

func (r *InspectionPolicyReconciler) generateCronJobCR(policy *goharborv1.InspectionPolicy) (*batchv1beta1.CronJob, error) {
	var fl int32 = 1

	cj := &batchv1beta1.CronJob{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(policy.Name),
			Namespace: *policy.Spec.WorkNamespace,
			Labels: map[string]string{
				labelOwnerKey: policy.Name,
			},
			Annotations: make(map[string]string),
		},
		Spec: batchv1beta1.CronJobSpec{
			Schedule:                   policy.Spec.Schedule,
			ConcurrencyPolicy:          batchv1beta1.ConcurrencyPolicy(policy.Spec.Strategy.ConcurrencyRule),
			Suspend:                    policy.Spec.Strategy.Suspend,
			SuccessfulJobsHistoryLimit: policy.Spec.Strategy.HistoryLimit,
			FailedJobsHistoryLimit:     &fl,
			JobTemplate: batchv1beta1.JobTemplateSpec{
				Spec: batchv1.JobSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{
									Name:            "inspector",
									Image:           getImage(policy),
									ImagePullPolicy: getImagePullPolicy(policy),
									Command:         []string{"/inspector"},
									Args: []string{
										"--policy",
										policy.Name,
									},
								},
							},
							RestartPolicy:      corev1.RestartPolicyOnFailure,
							ServiceAccountName: saName,
						},
					},
				},
			},
		},
	}

	if policy.Spec.Inspector != nil {
		if len(policy.Spec.Inspector.ImagePullSecrets) > 0 {
			cj.Spec.JobTemplate.Spec.Template.Spec.ImagePullSecrets = append(
				cj.Spec.JobTemplate.Spec.Template.Spec.ImagePullSecrets,
				policy.Spec.Inspector.ImagePullSecrets...)
		}
	}

	// Set owner reference.
	if err := ctrl.SetControllerReference(policy, cj, r.Scheme); err != nil {
		return nil, err
	}

	jdata, err := json.Marshal(cj.Spec)
	if err != nil {
		return nil, err
	}

	cj.Annotations[lastAppliedAnnotation] = string(jdata)

	return cj, nil
}

func (r *InspectionPolicyReconciler) generateCronJobCR4KubeBench(policy *goharborv1.InspectionPolicy) (*batchv1beta1.CronJob, error) {

	var fl int32 = 1

	cj := &batchv1beta1.CronJob{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(policy.Name + "_kube-bench"),
			Namespace: *policy.Spec.WorkNamespace,
			Labels: map[string]string{
				labelOwnerKey: policy.Name,
			},
			Annotations: make(map[string]string),
		},
		Spec: batchv1beta1.CronJobSpec{
			Schedule:                   policy.Spec.Schedule,
			ConcurrencyPolicy:          batchv1beta1.ConcurrencyPolicy(policy.Spec.Strategy.ConcurrencyRule),
			Suspend:                    policy.Spec.Strategy.Suspend,
			SuccessfulJobsHistoryLimit: policy.Spec.Strategy.HistoryLimit,
			FailedJobsHistoryLimit:     &fl,
			JobTemplate: batchv1beta1.JobTemplateSpec{
				Spec: batchv1.JobSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{
									Name:            "kubebench",
									Image:           getImage(policy),
									ImagePullPolicy: getImagePullPolicy(policy),
									Command:         []string{"/kubebench"},
									Args: []string{
										"--policy",
										policy.Name,
									},
								},
							},
							RestartPolicy:      corev1.RestartPolicyOnFailure,
							ServiceAccountName: saName,
						},
					},
				},
			},
		},
	}

	if policy.Spec.Inspector != nil {
		if len(policy.Spec.Inspector.ImagePullSecrets) > 0 {
			cj.Spec.JobTemplate.Spec.Template.Spec.ImagePullSecrets = append(
				cj.Spec.JobTemplate.Spec.Template.Spec.ImagePullSecrets,
				policy.Spec.Inspector.ImagePullSecrets...)
		}
	}

	// Set owner reference.
	if err := ctrl.SetControllerReference(policy, cj, r.Scheme); err != nil {
		return nil, err
	}

	jdata, err := json.Marshal(cj.Spec)
	if err != nil {
		return nil, err
	}

	cj.Annotations[lastAppliedAnnotation] = string(jdata)

	return cj, nil
}

func getImage(policy *goharborv1.InspectionPolicy) string {
	if policy.Spec.Inspector != nil {
		return policy.Spec.Inspector.Image
	}

	return fmt.Sprintf("%s:%s", defaultImage, defaultImageTag)
}

func getImagePullPolicy(policy *goharborv1.InspectionPolicy) corev1.PullPolicy {
	if policy.Spec.Inspector != nil {
		return policy.Spec.Inspector.ImagePullPolicy
	}

	return corev1.PullIfNotPresent
}

func randomName(base string) string {
	return names.SimpleNameGenerator.GenerateName(base)
}
