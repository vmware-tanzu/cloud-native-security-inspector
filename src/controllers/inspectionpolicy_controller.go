// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package controllers

import (
	"context"
	"fmt"

	"strings"

	"github.com/go-logr/logr"
	"github.com/pkg/errors"
	goharborv1 "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
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
	labelTypeKey          = "cnsi/inspector-type"
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

	// Process the cronjob for inspection
	var statusNeedUpdateForInspection bool
	statusNeedUpdateForInspection, err = r.cronjobForInspection(ctx, policy, goharborv1.CronjobInpsection, logger)

	// Process the cronjob for kubebench
	var statusNeedUpdateForKubebench bool
	statusNeedUpdateForKubebench, err = r.cronjobForInspection(ctx, policy, goharborv1.CronjobKubebench, logger)

	// Process the cronjob for risk
	var statusNeedUpdateForRisk bool
	statusNeedUpdateForRisk, err = r.cronjobForInspection(ctx, policy, goharborv1.CronjobRisk, logger)

	// either inspection or kubebench needs update, it should be updated
	var statusNeedUpdate bool
	if statusNeedUpdateForInspection || statusNeedUpdateForKubebench || statusNeedUpdateForRisk {
		statusNeedUpdate = true
	}

	// Update the policy status when necessary.
	r.updatePolicyStatus(policy, statusNeedUpdate, ctx)
	if err != nil {
		return ctrl.Result{}, err
	}
	logger.Info("Reconcile completed")
	return ctrl.Result{}, nil
}

func (r *InspectionPolicyReconciler) cronjobForInspection(ctx context.Context, policy *goharborv1.InspectionPolicy,
	cronjobType string, logger logr.Logger) (bool, error) {
	statusNeedUpdate := false
	if cronjobType == goharborv1.CronjobInpsection && policy.Spec.Inspector.Image == "" {
		return false, nil
	} else if cronjobType == goharborv1.CronjobKubebench && policy.Spec.Inspector.KubebenchImage == "" {
		return false, nil
	} else if cronjobType == goharborv1.CronjobRisk && policy.Spec.Inspector.RiskImage == "" {
		return false, nil
	}

	// Check whether the underlying cronjob resource is existing or not.
	cj, err := r.checkCronJob(ctx, policy, cronjobType)
	if err != nil {
		logger.Error(err, "unable to check underlying cron job")
		return false, err
	}

	cjCR, err := r.generateCronJobCR(policy, cronjobType)
	if err != nil {
		logger.Error(err, "unable to generate underlying cronjob CR")
		return false, err
	}

	if cj == nil {
		// Create new when cronjob is not existing.
		logger.V(1).Info("Create underlying cronjob")
		if err := r.Client.Create(ctx, cjCR); err != nil {
			logger.Error(err, "unable to create underlying cronjob", "cronjob", cjCR)
			return false, err
		}

		// Retrieve again for further usage?
		var ncj batchv1beta1.CronJob
		if err := r.Client.Get(ctx, client.ObjectKey{
			Namespace: cjCR.Namespace,
			Name:      cjCR.Name,
		}, &ncj); err != nil {
			logger.Error(err, "unable to retrieve the newly created underlying cronjob")
			return false, err
		}

		cj = &ncj
	} else {
		// If cronjob is already existed, check if the status of InspectionPolicy needs to be updated.
		logger.V(1).Info("Found underlying cronjob existing", "cronjob", cj)
		if r.changed(cj, cjCR) {
			logger.V(1).Info("Update underlying cronjob")

			// If .spec.suspend changes, statusNeedUpdate will be marked as true to update the status of InspectionPolicy.
			// Executions that are suspended during their scheduled time count as missed jobs.
			// When .spec.suspend changes from true to false on an existing cron job without a starting deadline,
			// the missed jobs are scheduled immediately.
			statusNeedUpdate = *cj.Spec.Suspend != *cjCR.Spec.Suspend

			// TODO:Delete the update for Cronjob for now.
			//cj.Spec = cjCR.DeepCopy().Spec
			//if err := r.Client.Update(ctx, cj); err != nil {
			//	logger.Error(err, "unable to update underlying cronjob", "cronjob", cj)
			//	return false, err
			//}
		}
	}

	// Ensure executor reference is set.
	if policy.Status.InspectionExecutor == nil {
		if cj != nil {
			// Add reference.
			ref, err := reference.GetReference(r.Scheme, cj)
			if err != nil {
				logger.Error(err, "unable to get reference of underlying cronjob", "cronjob", cj)
				return false, err
			}

			policy.Status.InspectionExecutor = ref
			statusNeedUpdate = true
		}
	}
	return statusNeedUpdate, nil
}

func (r *InspectionPolicyReconciler) updatePolicyStatus(policy *goharborv1.InspectionPolicy,
	statusNeedUpdate bool, ctx context.Context) error {
	if statusNeedUpdate || len(policy.Status.Status) == 0 {
		policy.Status.Status = goharborv1.PolicyStandby
		if *policy.Spec.Strategy.Suspend {
			policy.Status.Status = goharborv1.PolicySuspend
		}
		log.Log.Info("Update status of inspection policy", "status", policy.Status.Status)

		if err := r.Status().Update(ctx, policy); err != nil {
			log.Log.Error(err, "failed to update status of inspection policy")
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
	// For non-NOTFOUND error, directly return.
	if err == nil || !apierrors.IsNotFound(err) {
		return ns, err
	}

	// Create namespace now with policy name and set the workNamespace.
	newOne := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: *ns,
			Labels: map[string]string{
				labelOwnerKey: *ns,
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
	err := r.Client.Get(ctx, client.ObjectKey{
		Name: roleBindingName,
	}, crb)

	needToCreateCrb := false
	if err != nil {
		if !apierrors.IsNotFound(err) {
			return errors.Wrapf(err, "failed to get cluster rolebinding: %s", roleBindingName)
		} else {
			// This means that the crb doesn't exist, will creat later
			needToCreateCrb = true
		}
	} else {
		if len(crb.Subjects) != 1 {
			return errors.Errorf("the crb %s should always have 1 subject but got %v", roleBindingName, len(crb.Subjects))
		}
		if crb.Subjects[0].Namespace == ns {
			// The crb exist and the linked service account is in the same namespace with the policy's latest workspace,
			// then we need to do nothing here.
			return nil
		}
		// Otherwise, the crb's linked service account is in the old namespace, so we need to update the existing crb to point
		// to the newest service account, in the new workspace.
	}
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
	// Here either we need to create the crb or update the old one. The no-need-to-do-anything case has been handled.
	if needToCreateCrb {
		if err := r.Client.Create(ctx, ncrb); err != nil {
			return errors.Wrapf(err, "failed to create crb %s", roleBindingName)
		}
	} else {
		if err := r.Client.Update(ctx, ncrb); err != nil {
			return errors.Wrapf(err, "failed to update crb: %s", roleBindingName)
		}
	}
	return nil
}

func (r *InspectionPolicyReconciler) checkCronJob(ctx context.Context, policy *goharborv1.InspectionPolicy,
	cronjobType string) (*batchv1beta1.CronJob, error) {
	var exec *corev1.ObjectReference
	if cronjobType == goharborv1.CronjobInpsection {
		exec = policy.Status.InspectionExecutor
	} else if cronjobType == goharborv1.CronjobKubebench {
		exec = policy.Status.KubebenchExecutor
	} else if cronjobType == goharborv1.CronjobRisk {
		exec = policy.Status.RiskExecutor
	}

	if exec != nil {
		// Cronjob already has been created. Get the cron job and check if it is still existing.
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
	} else {
		// Try to list it.
		var jl batchv1beta1.CronJobList
		if err := r.List(ctx, &jl, client.MatchingLabels{labelOwnerKey: policy.Name, labelTypeKey: cronjobType}); err != nil {
			return nil, err
		}

		// Nothing found.
		if len(jl.Items) == 0 {
			return nil, nil
		}

		// If duplicated cronjob of this type has been found, return the new one and delete others.
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

}

func (r *InspectionPolicyReconciler) generateCronJobCR(policy *goharborv1.InspectionPolicy, cronjobType string) (*batchv1beta1.CronJob, error) {
	var fl int32 = 1
	var name, image, command string
	if cronjobType == goharborv1.CronjobInpsection {
		name = "inspector"
		command = "/inspector"
	} else if cronjobType == goharborv1.CronjobKubebench {
		name = "kubebench"
		command = "/kubebench"
	} else if cronjobType == goharborv1.CronjobRisk {
		name = "risk"
		command = "/risk"
	}
	image = getImage(policy, cronjobType)

	cj := &batchv1beta1.CronJob{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(policy.Name) + "--" + name,
			Namespace: *policy.Spec.WorkNamespace,
			Labels: map[string]string{
				labelOwnerKey: policy.Name,
				labelTypeKey:  cronjobType,
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
									Name:            name,
									Image:           image,
									ImagePullPolicy: getImagePullPolicy(policy),
									Command:         []string{command},
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

	if cronjobType == goharborv1.CronjobRisk {
		cj.Spec.JobTemplate.Spec.Template.Spec.Containers[0].Env = []corev1.EnvVar{
			{
				Name:  "SERVER_ADDR",
				Value: "http://127.0.0.1:8080",
			},
		}
		cj.Spec.JobTemplate.Spec.Template.Spec.Containers = append(cj.Spec.JobTemplate.Spec.Template.Spec.Containers, corev1.Container{
			Name:            "server",
			Image:           image,
			ImagePullPolicy: getImagePullPolicy(policy),
			Command:         []string{command},
			Args: []string{
				"--policy",
				policy.Name,
				"--mode",
				"server-only",
			},
			Env: []corev1.EnvVar{
				{
					Name:  "SERVER_ADDR",
					Value: ":8080",
				},
			},
			Ports: []corev1.ContainerPort{
				{
					ContainerPort: 8080,
				},
			},
		})
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

func getImage(policy *goharborv1.InspectionPolicy, cronjobType string) string {
	if policy.Spec.Inspector != nil {
		if cronjobType == goharborv1.CronjobInpsection {
			return policy.Spec.Inspector.Image
		} else if cronjobType == goharborv1.CronjobKubebench {
			return policy.Spec.Inspector.KubebenchImage
		} else if cronjobType == goharborv1.CronjobRisk {
			return policy.Spec.Inspector.RiskImage
		}
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
