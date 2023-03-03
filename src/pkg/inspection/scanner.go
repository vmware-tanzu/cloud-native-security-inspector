// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package inspection

import (
	"context"
	"fmt"

	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/selection"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/reference"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// Scanner used to scan workloads of the cluster.
type Scanner interface {
	// ScanNamespaces scans all the namespaces matching the selector and
	// excluded by the skips slice.
	ScanNamespaces(ctx context.Context, selector *metav1.LabelSelector, skips []string) ([]corev1.ObjectReference, error)
	// ScanWorkloads scans all the workloads that matches the selector under the namespace.
	ScanWorkloads(ctx context.Context, namespace corev1.LocalObjectReference, selector *metav1.LabelSelector) ([]*v1alpha1.Workload, error)
	// ScanOtherResource scans any kind resource that matches the selector under the namespace.
	ScanOtherResource(ctx context.Context, namespace corev1.LocalObjectReference, selector *metav1.LabelSelector, list client.ObjectList) error
}

// DefaultScanner implements inspection.Scanner.
type DefaultScanner struct {
	client.Client
	scheme *runtime.Scheme
}

// NewScanner news a default scanner.
func NewScanner() *DefaultScanner {
	return &DefaultScanner{}
}

// WithScheme sets schema.
func (ds *DefaultScanner) WithScheme(scheme *runtime.Scheme) *DefaultScanner {
	ds.scheme = scheme
	return ds
}

// UseClient uses the client.
func (ds *DefaultScanner) UseClient(client client.Client) *DefaultScanner {
	ds.Client = client
	return ds
}

// Complete returns the scanner interface.
func (ds *DefaultScanner) Complete() Scanner {
	return ds
}

// ScanNamespaces implements inspection.Scanner.
func (ds *DefaultScanner) ScanNamespaces(ctx context.Context, selector *metav1.LabelSelector, skips []string) ([]corev1.ObjectReference, error) {
	nsl := &corev1.NamespaceList{}
	if err := ds.List(ctx, nsl, client.MatchingLabelsSelector{Selector: convertLabelSelector(selector)}); err != nil {
		return nil, errors.Wrap(err, "list namespace")
	}

	needSkip := func(ns string) bool {
		for _, n := range skips {
			if ns == n {
				return true
			}
		}

		return false
	}

	var nss []corev1.ObjectReference
	for _, ns := range nsl.Items {
		if needSkip(ns.Name) {
			log.Info("skip namespace", "namespace", ns)
			continue
		}

		nsRef, err := reference.GetReference(ds.scheme, &ns)
		if err != nil {
			return nil, err
		}

		nss = append(nss, *nsRef)
	}

	return nss, nil
}

// ScanWorkloads implements inspection.Scanner.
func (ds *DefaultScanner) ScanWorkloads(ctx context.Context, namespace corev1.LocalObjectReference, selector *metav1.LabelSelector) ([]*v1alpha1.Workload, error) {
	// Get workloads in sequence.
	// Treat as a whole operation at this time.
	var pods corev1.PodList
	if err := ds.List(ctx, &pods, client.InNamespace(namespace.Name), client.MatchingLabelsSelector{Selector: convertLabelSelector(selector)}); err != nil {
		return nil, errors.Wrap(err, "list pods")
	}

	workloadIndexer := make(map[string]*v1alpha1.Workload)
	for _, pod := range pods.Items {
		if err := ds.processPod(ctx, pod, workloadIndexer); err != nil {
			if err != nil {
				return nil, errors.Wrap(err, "process pod")
			}
		}
	}

	var scannedWorkloads []*v1alpha1.Workload
	for _, wl := range workloadIndexer {
		scannedWorkloads = append(scannedWorkloads, wl)
	}

	return scannedWorkloads, nil
}

func (ds *DefaultScanner) processPod(ctx context.Context, pod corev1.Pod, indexer map[string]*v1alpha1.Workload) error {
	givenUID := func(obj *corev1.ObjectReference) string {
		return fmt.Sprintf("%s:%s:%s", obj.Kind, obj.Name, obj.UID)
	}

	podRef, err := reference.GetReference(ds.scheme, &pod)
	if err != nil {
		return errors.Wrap(err, "get pod reference")
	}

	owner, replicaSetCount, err := ds.getOwner(ctx, pod)
	if err != nil {
		return errors.Wrap(err, "get pod owner")
	}

	uid := givenUID(podRef)
	if owner != nil {
		uid = givenUID(owner)
	}

	if _, ok := indexer[uid]; !ok {
		indexer[uid] = &v1alpha1.Workload{}
		indexer[uid].Replicas = replicaSetCount
	}

	// Set owner reference.
	if owner != nil {
		indexer[uid].ObjectReference = *owner
	}

	// Append the pod.
	pd := &v1alpha1.Pod{
		ObjectReference: *podRef,
		Containers:      extractContainers(pod),
	}

	indexer[uid].Pods = append(indexer[uid].Pods, pd)

	return nil
}

func (ds *DefaultScanner) getOwner(ctx context.Context, pod corev1.Pod) (*corev1.ObjectReference, int32, error) {
	refs := pod.GetOwnerReferences()
	if ref, yes := hasReplicaSet(refs); yes {
		rsOwnerRef, replicaSetCount, err := ds.getReplicaSetOwnerRef(ctx, types.NamespacedName{
			Namespace: pod.Namespace,
			Name:      ref.Name,
		})
		if err != nil {
			return nil, 0, errors.Wrap(err, "get replicaSet owner ref")
		}

		// Deployment?
		if rsOwnerRef != nil {
			return rsOwnerRef, replicaSetCount, nil
		}
	}

	return extractOwnerRef(pod.Namespace, refs), 0, nil
}

func (ds *DefaultScanner) getReplicaSetOwnerRef(ctx context.Context, namespacedName types.NamespacedName) (*corev1.ObjectReference, int32, error) {
	var rps appsv1.ReplicaSet
	if err := ds.Get(ctx, namespacedName, &rps); err != nil {
		return nil, 0, err
	}

	ownerRef := rps.GetOwnerReferences()

	return extractOwnerRef(namespacedName.Namespace, ownerRef), extractReplicaSet(ownerRef, rps), nil
}

// ScanOtherResource implements inspection.Scanner.
func (ds *DefaultScanner) ScanOtherResource(ctx context.Context, namespace corev1.LocalObjectReference,
	selector *metav1.LabelSelector, list client.ObjectList) error {
	if err := ds.List(ctx, list, client.InNamespace(namespace.Name), client.MatchingLabelsSelector{Selector: convertLabelSelector(selector)}); err != nil {
		return errors.Wrap(err, "list")
	}

	return nil
}

func extractContainers(pod corev1.Pod) []*v1alpha1.Container {
	var containers []*v1alpha1.Container

	getContainersFromStatus := func(csl []corev1.ContainerStatus, isInit bool, dict map[string]struct{}) []*v1alpha1.Container {
		var cl []*v1alpha1.Container

		for _, cs := range csl {
			cl = append(cl, &v1alpha1.Container{
				Name:    cs.Name,
				Image:   cs.Image,
				IsInit:  isInit,
				ImageID: cs.ImageID,
				ID:      cs.ContainerID,
			})

			dict[cs.Name] = struct{}{}
		}

		return cl
	}

	flags := make(map[string]struct{}, 0)

	// Check started init containers
	csl := getContainersFromStatus(pod.Status.ContainerStatuses, false, flags)
	containers = append(containers, csl...)
	icsl := getContainersFromStatus(pod.Status.InitContainerStatuses, true, flags)
	containers = append(containers, icsl...)

	getContainersFromSpec := func(cl []corev1.Container, isInit bool, dict map[string]struct{}) []*v1alpha1.Container {
		var containers []*v1alpha1.Container

		for _, c := range cl {
			if _, ok := dict[c.Name]; !ok {
				containers = append(containers, &v1alpha1.Container{
					Name:   c.Name,
					Image:  c.Image,
					IsInit: isInit,
				})
			}
		}

		return containers
	}
	// Add un-started containers
	cl := getContainersFromSpec(pod.Spec.Containers, false, flags)
	containers = append(containers, cl...)
	icl := getContainersFromSpec(pod.Spec.InitContainers, true, flags)
	containers = append(containers, icl...)

	return containers
}

func extractOwnerRef(ns string, ownerRefs []metav1.OwnerReference) *corev1.ObjectReference {
	for _, or := range ownerRefs {
		if isWorkload(or.Kind) {
			return &corev1.ObjectReference{
				Kind:       or.Kind,
				Namespace:  ns,
				Name:       or.Name,
				APIVersion: or.APIVersion,
				UID:        or.UID,
			}
		}
	}

	return nil
}

func extractReplicaSet(ownerRefs []metav1.OwnerReference, rps appsv1.ReplicaSet) int32 {
	for _, or := range ownerRefs {
		if isWorkload(or.Kind) {
			return *rps.Spec.Replicas
		}
	}

	return 0
}

func hasReplicaSet(ownerRefs []metav1.OwnerReference) (metav1.OwnerReference, bool) {
	for _, or := range ownerRefs {
		if or.Kind == v1alpha1.WorkloadKindReplicaSet {
			return or, true
		}
	}

	return metav1.OwnerReference{}, false
}

func isWorkload(kind string) bool {
	for _, k := range v1alpha1.AllWorkloads {
		if k == kind {
			return true
		}
	}

	return false
}

func convertLabelSelector(selector *metav1.LabelSelector) labels.Selector {
	if selector == nil {
		return labels.NewSelector()
	}

	operator := func(op metav1.LabelSelectorOperator) selection.Operator {
		switch op {
		case metav1.LabelSelectorOpExists:
			return selection.Exists
		case metav1.LabelSelectorOpDoesNotExist:
			return selection.DoesNotExist
		case metav1.LabelSelectorOpIn:
			return selection.In
		case metav1.LabelSelectorOpNotIn:
			return selection.NotIn
		default:
			return selection.Equals
		}
	}
	sel := labels.SelectorFromValidatedSet(selector.MatchLabels)
	for _, ls := range selector.MatchExpressions {
		r, err := labels.NewRequirement(ls.Key, operator(ls.Operator), ls.Values)
		if err == nil {
			sel.Add(*r)
		}
	}

	return sel
}
