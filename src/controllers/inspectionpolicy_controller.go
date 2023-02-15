// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package controllers

import (
	"context"
	"fmt"
	appsv1 "k8s.io/api/apps/v1"
	"strconv"

	"strings"

	"github.com/pkg/errors"
	goharborv1 "github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	batchv1 "k8s.io/api/batch/v1"
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
)

const (
	appLabelKey                     = "app"
	defaultImage                    = "projects.registry.vmware.com/cnsi/inspector"
	defaultImageTag                 = "0.3"
	labelOwnerKey                   = "goharbor.io/policy-working-for"
	labelTypeKey                    = "cnsi/inspector-type"
	lastAppliedAnnotation           = "goharbor.io/last-applied-spec"
	varLibEtcdPath                  = "/var/lib/etcd"
	varLibKubeletPath               = "/var/lib/kubelet"
	varLibKubeSchedulerPath         = "/var/lib/kube-scheduler"
	varLibKubeControllerManagerPath = "/var/lib/kube-controller-manager"
	etcSystemdPath                  = "/etc/systemd"
	libSystemdPath                  = "/lib/systemd/"
	srvKubernetesPath               = "/srv/kubernetes/"
	etcKubernetesPath               = "/etc/kubernetes"
	usrBinPath                      = "/usr/local/mount-from-host/bin"
	etcCniNetdPath                  = "/etc/cni/net.d/"
	optCniBinPath                   = "/opt/cni/bin/"
)

// InspectionPolicyReconciler reconciles a InspectionPolicy object
type InspectionPolicyReconciler struct {
	client.Client
	Scheme   *runtime.Scheme
	nodeList []string
	pathList []string
}

//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=inspectionpolicies,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=inspectionpolicies/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=goharbor.goharbor.io,resources=inspectionpolicies/finalizers,verbs=update
//+kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterroles,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterrolebindings,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="",resources=serviceaccounts,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="batch",resources=cronjobs,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="core",resources=nodes,verbs=get;list;watch
//+kubebuilder:rbac:groups="apps",resources=daemonsets,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="apps",resources=deployments,verbs=get;list
//+kubebuilder:rbac:groups="core",resources=services,verbs=get;list

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.8.3/pkg/reconcile
func (r *InspectionPolicyReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {

	log.Info("Reconciling inspector policy")

	r.nodeList = []string{}
	nodeList := corev1.NodeList{}
	if err := r.List(ctx, &nodeList, &client.ListOptions{}); err != nil {
		return ctrl.Result{}, err
	}
	for _, node := range nodeList.Items {
		r.nodeList = append(r.nodeList, node.ObjectMeta.Name)
	}
	log.Info("Node list:", "nodes:", r.nodeList)

	// First, get the inspector policy.
	policy := &goharborv1.InspectionPolicy{}
	if err := r.Get(ctx, req.NamespacedName, policy); err != nil {
		if !apierrors.IsNotFound(err) {
			log.Error("unable to get inspection policy")
		}
		// Ignore the not found error.
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}
	log.Debugf("Inspection policy: %v", policy)

	// Deleting...
	if !policy.DeletionTimestamp.IsZero() {
		log.Info("inspector is disabled as policy is being deleted", "policy", req.NamespacedName)
		// Exit gracefully and no clean up needed.
		return ctrl.Result{}, nil
	}

	// Ensure the work namespace is there.
	wns, err := r.ensureWorkNamespace(ctx, policy)
	if err != nil {
		log.Error(err, "unable to ensure the work namespace")
		return ctrl.Result{}, err
	}
	log.Info("Ensure work namespace", "namespace", wns)

	// For further usage.
	policy.Spec.WorkNamespace = wns

	// Ensure Setting is correctly configured.
	datasource, err := r.EnsureSettings(ctx, policy)
	if err != nil {
		log.Error(err, "unable to ensure the settings in inspection policy")
		return ctrl.Result{}, err
	}
	log.Info("Ensure settings in inspection policy", "datasource in settings", datasource)

	// Ensure RBAC is correctly configured.
	if err := r.ensureRBAC(ctx, *wns); err != nil {
		log.Error(err, "ensure RBAC of inspector")
		return ctrl.Result{}, err
	}

	// Process the cronjob for inspection
	var statusNeedUpdateForInspection bool
	statusNeedUpdateForInspection, err = r.cronjobForInspection(ctx, policy, goharborv1.CronjobInpsection)

	// Process the cronjob for kubebench
	var statusNeedUpdateForKubebench bool
	statusNeedUpdateForKubebench, err = r.checkKubebench(ctx, policy)
	// Process the cronjob for risk
	var statusNeedUpdateForRisk bool
	statusNeedUpdateForRisk, err = r.cronjobForInspection(ctx, policy, goharborv1.CronjobRisk)

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
	log.Info("Reconcile completed")
	return ctrl.Result{}, nil
}

func (r *InspectionPolicyReconciler) checkKubebench(ctx context.Context, policy *goharborv1.InspectionPolicy) (bool, error) {
	if policy.Spec.Inspector.KubebenchImage == "" {
		log.Info(nil, "the user doesn't involve Kubebench Image in policy")
		return false, nil
	}
	var kubebenchDaemonSet appsv1.DaemonSet
	namespacedName := types.NamespacedName{
		Name:      fmt.Sprintf("%s-kubebench-daemonset", policy.Name),
		Namespace: *policy.Spec.WorkNamespace,
	}
	if err := r.Get(ctx, namespacedName, &kubebenchDaemonSet); err != nil {
		if !apierrors.IsNotFound(err) {
			log.Error(err, "failed to get information of the kubebench daemonset")
			return true, err
		} else {
			// cannot find the DaemonSet resource
			dsStruct, err := r.constructKubebenchDaemonSet(policy)
			if err != nil {
				log.Error(err, "failed to construct the DaemonSet struct")
				return true, err
			} else {
				err = r.Client.Create(ctx, dsStruct)
				if err != nil {
					log.Errorf("failed to create the DaemonSet for kubebench %s, err:", err)
					return true, err
				}
				return false, err
			}
		}
	}
	log.Debug("The daemonSet is already existing")
	return false, nil
}

func (r *InspectionPolicyReconciler) constructKubebenchDaemonSet(
	policy *goharborv1.InspectionPolicy) (*appsv1.DaemonSet, error) {
	command := "/kubebench"
	rootUid := int64(0)
	fsPolicy := corev1.FSGroupChangeOnRootMismatch
	container := corev1.Container{
		Name:            "kubebench",
		Image:           policy.Spec.Inspector.KubebenchImage,
		ImagePullPolicy: getImagePullPolicy(policy),
		Command:         []string{command},
		Args: []string{
			"--policy",
			policy.Name,
		},
	}
	r.addVolumeMountsToContainer(&container)
	podSpec := corev1.PodSpec{
		HostPID: true,
		SecurityContext: &corev1.PodSecurityContext{
			RunAsUser:           &rootUid,
			FSGroupChangePolicy: &fsPolicy,
		},
		Containers:         []corev1.Container{container},
		RestartPolicy:      corev1.RestartPolicyAlways,
		ServiceAccountName: saName,
		ImagePullSecrets:   policy.Spec.Inspector.ImagePullSecrets,
	}
	r.addVolumeToPodSpec(&podSpec)
	ds := appsv1.DaemonSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      fmt.Sprintf("%s-kubebench-daemonset", policy.Name),
			Namespace: *policy.Spec.WorkNamespace,
			Labels: map[string]string{
				labelOwnerKey: policy.Name,
				labelTypeKey:  goharborv1.DaemonSetKubebench,
			},
			Annotations: make(map[string]string),
		},
		Spec: appsv1.DaemonSetSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					appLabelKey: "kubebench",
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						appLabelKey: "kubebench",
					},
				},
				Spec: podSpec,
			},
		},
	}
	// Set owner reference.
	if err := ctrl.SetControllerReference(policy, &ds, r.Scheme); err != nil {
		return nil, err
	}
	jdata, err := json.Marshal(ds.Spec)
	if err != nil {
		return nil, err
	}
	ds.Annotations[lastAppliedAnnotation] = string(jdata)
	log.Infof("Kubebench DaemonSet %s constructed", ds.ObjectMeta.Name)
	return &ds, nil
}

func (r *InspectionPolicyReconciler) cronjobForInspection(ctx context.Context, policy *goharborv1.InspectionPolicy,
	cronjobType string) (bool, error) {
	statusNeedUpdate := false
	if cronjobType == goharborv1.CronjobInpsection && policy.Spec.Inspector.Image == "" {
		return false, nil
	} else if cronjobType == goharborv1.CronjobRisk && policy.Spec.Inspector.RiskImage == "" {
		return false, nil
	}
	var cj *batchv1.CronJob
	var cjCR *batchv1.CronJob
	var err error

	// Check whether the underlying cronjob resource is existing or not.
	cj, err = r.checkCronJob(ctx, policy, cronjobType)
	if err != nil {
		log.Error(err, "unable to check underlying cron job")
		return false, err
	}
	cjCR, err = r.generateCronJobCR(policy, cronjobType)
	if err != nil {
		log.Error(err, "unable to generate underlying cronjob CR")
		return false, err
	}

	if cj == nil {
		// Create new when cronjob is not existing.
		log.Info("Create underlying cronjob")
		if err := r.Client.Create(ctx, cjCR); err != nil {
			log.Error(err, "unable to create underlying cronjob", "cronjob", cjCR.Name)
			return false, err
		}
		// Retrieve again for further usage?
		var ncj batchv1.CronJob
		if err := r.Client.Get(ctx, client.ObjectKey{
			Namespace: cjCR.Namespace,
			Name:      cjCR.Name,
		}, &ncj); err != nil {
			log.Error(err, "unable to retrieve the newly created underlying cronjob")
			return false, err
		}
		cj = &ncj
	} else {
		// If cronjob is already existed, check if the status of InspectionPolicy needs to be updated.
		log.Info("Found underlying cronjob existing", "cronjob", cj.Name)
		if r.changed(cj, cjCR) {
			log.Info("Update underlying cronjob")

			// If .spec.suspend changes, statusNeedUpdate will be marked as true to update the status of InspectionPolicy.
			// Executions that are suspended during their scheduled time count as missed jobs.
			// When .spec.suspend changes from true to false on an existing cron job without a starting deadline,
			// the missed jobs are scheduled immediately.
			statusNeedUpdate = *cj.Spec.Suspend != *cjCR.Spec.Suspend
		}
	}

	// Ensure executor reference is set.
	if policy.Status.InspectionExecutor == nil {
		if cj != nil {
			// Add reference.
			ref, err := reference.GetReference(r.Scheme, cj)
			if err != nil {
				log.Error(err, "unable to get reference of underlying cronjob", "cronjob", cj.Name)
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
		log.Info("Update status of inspection policy", "status", policy.Status.Status)

		if err := r.Status().Update(ctx, policy); err != nil {
			log.Error(err, "failed to update status of inspection policy")
			return err
		}
	}
	return nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *InspectionPolicyReconciler) SetupWithManager(mgr ctrl.Manager) error {
	r.pathList = []string{
		varLibEtcdPath,
		varLibKubeletPath,
		varLibKubeSchedulerPath,
		varLibKubeControllerManagerPath,
		etcSystemdPath,
		libSystemdPath,
		srvKubernetesPath,
		etcKubernetesPath,
		usrBinPath,
		etcCniNetdPath,
		optCniBinPath,
	}
	return ctrl.NewControllerManagedBy(mgr).
		For(&goharborv1.InspectionPolicy{}).
		Complete(r)
}

// changed indicates if the resource has changed.
func (r *InspectionPolicyReconciler) changed(current *batchv1.CronJob, now *batchv1.CronJob) bool {
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
			log.Error(err, "unable to get setting")
		}
		return nil, err
	}
	// if data source is disabled, return error.
	if setting.Spec.DataSource.Disabled {
		log.Info("The data source in settings is disabled")
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
				Kind:      "ServiceAccount",
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
	cronjobType string) (*batchv1.CronJob, error) {
	var exec *corev1.ObjectReference
	if cronjobType == goharborv1.CronjobInpsection {
		exec = policy.Status.InspectionExecutor
	} else if cronjobType == goharborv1.CronjobRisk {
		exec = policy.Status.RiskExecutor
	}

	if exec != nil {
		// Cronjob already has been created. Get the cron job and check if it is still existing.
		nsName := types.NamespacedName{
			Namespace: exec.Namespace,
			Name:      exec.Name,
		}
		var cronJob batchv1.CronJob
		if err := r.Client.Get(ctx, nsName, &cronJob); err != nil {
			log.Error(err, "unable to get the underlying cronjob", "cronjob", nsName)
			// Ignore the NOTFOUND error.
			return nil, client.IgnoreNotFound(err)
		}

		return &cronJob, nil
	} else {
		// Try to list it.
		var jl batchv1.CronJobList
		if err := r.List(ctx, &jl, client.MatchingLabels{labelOwnerKey: policy.Name, labelTypeKey: cronjobType}); err != nil {
			return nil, err
		}

		// Nothing found.
		if len(jl.Items) == 0 {
			return nil, nil
		}

		return &jl.Items[0], nil
	}

}

func (r *InspectionPolicyReconciler) addVolumeMountsToContainer(container *corev1.Container) {
	for i, path := range r.pathList {
		mount := corev1.VolumeMount{
			Name:             strconv.Itoa(i),
			ReadOnly:         true,
			MountPath:        path,
			SubPath:          "",
			MountPropagation: nil,
			SubPathExpr:      "",
		}
		container.VolumeMounts = append(container.VolumeMounts, mount)
	}
}

func (r *InspectionPolicyReconciler) addVolumeToPodSpec(podSpec *corev1.PodSpec) {
	hostPathType := corev1.HostPathDirectoryOrCreate
	for i, path := range r.pathList {
		hostPath := corev1.HostPathVolumeSource{Path: path, Type: &hostPathType}
		volume := corev1.Volume{
			Name:         strconv.Itoa(i),
			VolumeSource: corev1.VolumeSource{HostPath: &hostPath},
		}
		podSpec.Volumes = append(podSpec.Volumes, volume)
	}
}

func (r *InspectionPolicyReconciler) generateCronJobCR(policy *goharborv1.InspectionPolicy, cronjobType string) (*batchv1.CronJob, error) {
	var fl int32 = 1
	var name, image, command string
	if cronjobType == goharborv1.CronjobInpsection {
		name = "inspector"
		command = "/inspector"
	} else if cronjobType == goharborv1.CronjobRisk {
		name = "risk"
		command = "/risk"
	}
	image = getImage(policy, cronjobType)

	cj := &batchv1.CronJob{
		ObjectMeta: metav1.ObjectMeta{
			Name:      randomName(policy.Name) + "--" + name,
			Namespace: *policy.Spec.WorkNamespace,
			Labels: map[string]string{
				labelOwnerKey: policy.Name,
				labelTypeKey:  cronjobType,
			},
			Annotations: make(map[string]string),
		},
		Spec: batchv1.CronJobSpec{
			Schedule:                   policy.Spec.Schedule,
			ConcurrencyPolicy:          batchv1.ConcurrencyPolicy(policy.Spec.Strategy.ConcurrencyRule),
			Suspend:                    policy.Spec.Strategy.Suspend,
			SuccessfulJobsHistoryLimit: policy.Spec.Strategy.HistoryLimit,
			FailedJobsHistoryLimit:     &fl,
			JobTemplate: batchv1.JobTemplateSpec{
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
