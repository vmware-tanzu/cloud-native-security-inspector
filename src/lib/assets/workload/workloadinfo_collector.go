// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package workload

import (
	"context"
	"fmt"
	"github.com/pkg/errors"
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

// Collector used to scan workloads of the cluster.
type Collector interface {
	// CollectNamespaces scans all the namespaces matching the selector and
	// excluded by the skips slice.
	CollectNamespaces(ctx context.Context, selector *metav1.LabelSelector, skips []string) ([]corev1.ObjectReference, error)
	// CollectWorkloads scans all the workloads that matches the selector under the namespace.
	CollectWorkloads(ctx context.Context, namespace corev1.LocalObjectReference, selector *metav1.LabelSelector) ([]*Workload, error)
	// CollectOtherResource scans any kind resource that matches the selector under the namespace.
	CollectOtherResource(ctx context.Context, namespace corev1.LocalObjectReference, selector *metav1.LabelSelector, list client.ObjectList) error
}

// DefaultCollector implements the interface Collector
type DefaultCollector struct {
	client.Client
	scheme *runtime.Scheme
}

// NewCollector news a default collector.
func NewCollector() *DefaultCollector {
	return &DefaultCollector{}
}

// WithScheme sets schema.
func (dc *DefaultCollector) WithScheme(scheme *runtime.Scheme) *DefaultCollector {
	dc.scheme = scheme
	return dc
}

// UseClient uses the client.
func (dc *DefaultCollector) UseClient(client client.Client) *DefaultCollector {
	dc.Client = client
	return dc
}

// Complete returns the collector interface.
func (dc *DefaultCollector) Complete() Collector {
	return dc
}

// CollectNamespaces implements inspection.Collectner.
func (dc *DefaultCollector) CollectNamespaces(ctx context.Context, selector *metav1.LabelSelector, skips []string) ([]corev1.ObjectReference, error) {
	nsl := &corev1.NamespaceList{}
	if err := dc.List(ctx, nsl, client.MatchingLabelsSelector{Selector: convertLabelSelector(selector)}); err != nil {
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

		nsRef, err := reference.GetReference(dc.scheme, &ns)
		if err != nil {
			return nil, err
		}

		nss = append(nss, *nsRef)
	}

	return nss, nil
}

// CollectWorkloads implements inspection.Collectner.
func (dc *DefaultCollector) CollectWorkloads(ctx context.Context, namespace corev1.LocalObjectReference, selector *metav1.LabelSelector) ([]*Workload, error) {
	// Get workloads in sequence.
	// Treat as a whole operation at this time.
	var pods corev1.PodList
	if err := dc.List(ctx, &pods, client.InNamespace(namespace.Name), client.MatchingLabelsSelector{Selector: convertLabelSelector(selector)}); err != nil {
		return nil, errors.Wrap(err, "list pods")
	}

	workloadIndexer := make(map[string]*Workload)
	for _, pod := range pods.Items {
		if err := dc.processPod(ctx, pod, workloadIndexer); err != nil {
			if err != nil {
				return nil, errors.Wrap(err, "process pod")
			}
		}
	}

	var scannedWorkloads []*Workload
	for _, wl := range workloadIndexer {
		scannedWorkloads = append(scannedWorkloads, wl)
	}

	return scannedWorkloads, nil
}

func (dc *DefaultCollector) processPod(ctx context.Context, pod corev1.Pod, indexer map[string]*Workload) error {
	givenUID := func(obj *corev1.ObjectReference) string {
		return fmt.Sprintf("%s:%s:%s", obj.Kind, obj.Name, obj.UID)
	}

	podRef, err := reference.GetReference(dc.scheme, &pod)
	if err != nil {
		return errors.Wrap(err, "get pod reference")
	}

	owner, err := dc.getOwner(ctx, pod)
	if err != nil {
		return errors.Wrap(err, "get pod owner")
	}

	uid := givenUID(podRef)
	if owner != nil {
		uid = givenUID(owner)
	}

	if _, ok := indexer[uid]; !ok {
		indexer[uid] = &Workload{}
	}

	// Set owner reference.
	if owner != nil {
		indexer[uid].ObjectReference = *owner
	}

	// Append the pod.
	pd := &Pod{
		ObjectReference: *podRef,
		Containers:      extractContainers(pod),
	}

	indexer[uid].Pods = append(indexer[uid].Pods, pd)

	return nil
}

func (dc *DefaultCollector) getOwner(ctx context.Context, pod corev1.Pod) (*corev1.ObjectReference, error) {
	refs := pod.GetOwnerReferences()
	if ref, yes := hasReplicaSet(refs); yes {
		rsOwnerRef, err := dc.getReplicaSetOwnerRef(ctx, types.NamespacedName{
			Namespace: pod.Namespace,
			Name:      ref.Name,
		})
		if err != nil {
			return nil, errors.Wrap(err, "get replicaSet owner ref")
		}

		// Deployment?
		if rsOwnerRef != nil {
			return rsOwnerRef, nil
		}
	}

	return extractOwnerRef(pod.Namespace, refs), nil
}

func (dc *DefaultCollector) getReplicaSetOwnerRef(ctx context.Context, namespacedName types.NamespacedName) (*corev1.ObjectReference, error) {
	var rps appsv1.ReplicaSet
	if err := dc.Get(ctx, namespacedName, &rps); err != nil {
		return nil, err
	}

	return extractOwnerRef(namespacedName.Namespace, rps.GetOwnerReferences()), nil
}

// CollectOtherResource implements inspection.Collectner.
func (dc *DefaultCollector) CollectOtherResource(ctx context.Context, namespace corev1.LocalObjectReference,
	selector *metav1.LabelSelector, list client.ObjectList) error {
	if err := dc.List(ctx, list, client.InNamespace(namespace.Name), client.MatchingLabelsSelector{Selector: convertLabelSelector(selector)}); err != nil {
		return errors.Wrap(err, "list")
	}

	return nil
}

func extractContainers(pod corev1.Pod) []*Container {
	var containers []*Container

	getContainersFromStatus := func(csl []corev1.ContainerStatus, isInit bool, dict map[string]struct{}) []*Container {
		var cl []*Container

		for _, cs := range csl {
			cl = append(cl, &Container{
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

	getContainersFromSpec := func(cl []corev1.Container, isInit bool, dict map[string]struct{}) []*Container {
		var containers []*Container

		for _, c := range cl {
			if _, ok := dict[c.Name]; !ok {
				containers = append(containers, &Container{
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

func hasReplicaSet(ownerRefs []metav1.OwnerReference) (metav1.OwnerReference, bool) {
	for _, or := range ownerRefs {
		if or.Kind == ReplicaSet {
			return or, true
		}
	}

	return metav1.OwnerReference{}, false
}

func isWorkload(kind string) bool {
	for _, k := range AllWorkloads {
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
