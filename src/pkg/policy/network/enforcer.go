// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package network

import (
	"context"
	"fmt"

	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/policy/enforcement"
	corev1 "k8s.io/api/core/v1"
	netv1 "k8s.io/api/networking/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// EnforcerName is the name of network policy enforcer.
const EnforcerName = "quarantine_vulnerable_workload"

const (
	networkPolicyNamePrefix = "cnsi-networkpolicy-"
	annotationPolicyVendor  = "goharbor.io/vendor"
	annotationPolicyRole    = "goharbor.io/role"
	cnsiVendor              = "CNSI"
	denyAllRole             = "deny-all"
	matchPodLabelCtrl       = "goharbor.io/controller"
	matchPodLabelRisk       = "goharbor.io/inspection"
	risky                   = "risk"
)

// Enforcer enforces network policy.
// Check reference https://kubernetes.io/docs/concepts/services-networking/network-policies/.
type Enforcer struct {
	// Client of k8s.
	kc     client.Client
	scheme *runtime.Scheme
}

// New Enforcer.
func New() *Enforcer {
	return &Enforcer{}
}

// UseClient uses k8s client.
func (e *Enforcer) UseClient(cli client.Client) *Enforcer {
	e.kc = cli
	return e
}

// WithScheme with scheme.
func (e *Enforcer) WithScheme(scheme *runtime.Scheme) *Enforcer {
	e.scheme = scheme
	return e
}

// Enforce implements policy.Enforcer.
func (e *Enforcer) Enforce(ctx context.Context, workload *v1alpha1.Workload, option ...enforcement.Option) error {
	if workload == nil {
		return errors.New("empty workload for enforcing policy")
	}

	// Make sure the root network policy existing.
	if err := e.ensureNetworkPolicy(ctx, workload.Namespace); err != nil {
		return errors.Wrap(err, "ensure network policy")
	}

	// Just add labels to let the pods of the workload impacted by the root network policy.
	for _, po := range workload.Pods {
		// Get pod object.
		pod := &corev1.Pod{}
		if err := e.kc.Get(ctx, client.ObjectKey{
			Namespace: po.Namespace,
			Name:      po.Name,
		}, pod); err != nil {
			return errors.Wrapf(err, "get pod object %s:%s", po.Namespace, po.Name)
		}

		updateCounter := 0
		// Add labels.
		if _, ok := pod.Labels[matchPodLabelCtrl]; !ok {
			pod.Labels[matchPodLabelCtrl] = cnsiVendor
			updateCounter++
		}

		if _, ok := pod.Labels[matchPodLabelRisk]; !ok {
			pod.Labels[matchPodLabelRisk] = risky
			updateCounter++
		}

		if updateCounter > 0 {
			// Update pod to reflect changes.
			if err := e.kc.Update(ctx, pod); err != nil {
				return errors.Wrapf(err, "update pod object %s:%s", pod.Namespace, pod.Name)
			}
		}
	}

	return nil
}

// Revoke implements policy.Enforcer.
func (e *Enforcer) Revoke(ctx context.Context, workload *v1alpha1.Workload) error {
	if workload == nil {
		return errors.New("empty workload for revoking policy")
	}

	// Just remove labels to get rid of root network policy.
	for _, po := range workload.Pods {
		// Get pod object.
		pod := &corev1.Pod{}
		if err := e.kc.Get(ctx, client.ObjectKey{
			Namespace: po.Namespace,
			Name:      po.Name,
		}, pod); err != nil {
			return errors.Wrapf(err, "get pod object %s:%s", po.Namespace, po.Name)
		}

		updateCounter := 0
		// Remove labels.
		if _, ok := pod.Labels[matchPodLabelCtrl]; ok {
			delete(pod.Labels, matchPodLabelCtrl)
			updateCounter++
		}

		if _, ok := pod.Labels[matchPodLabelRisk]; ok {
			delete(pod.Labels, matchPodLabelRisk)
			updateCounter++
		}

		if updateCounter > 0 {
			// Update pod to reflect changes.
			if err := e.kc.Update(ctx, pod); err != nil {
				return errors.Wrapf(err, "update pod object %s:%s", pod.Namespace, pod.Name)
			}
		}
	}

	// Remove the root network policy when necessary.
	return e.removeNetworkPolicy(ctx, workload.Namespace)
}

// IsManaged implements policy.Enforcer.
func (e *Enforcer) IsManaged(ctx context.Context, workload *v1alpha1.Workload) (bool, error) {
	if workload == nil {
		return false, errors.New("empty workload for checking policy managed status")
	}

	isManaged := true
	for _, po := range workload.Pods {
		// Get pod object.
		pod := &corev1.Pod{}
		if err := e.kc.Get(ctx, client.ObjectKey{
			Namespace: po.Namespace,
			Name:      po.Name,
		}, pod); err != nil {
			return false, errors.Wrapf(err, "get pod object %s:%s", po.Namespace, po.Name)
		}

		_, ok1 := pod.Labels[matchPodLabelCtrl]
		_, ok2 := pod.Labels[matchPodLabelRisk]

		isManaged = isManaged && ok1 && ok2
	}

	return isManaged, nil
}

// ensureNetworkPolicy ensure the network policy for ns existing.
func (e *Enforcer) ensureNetworkPolicy(ctx context.Context, ns string) error {
	pname := fmt.Sprintf("%s-%s", networkPolicyNamePrefix, ns)
	// Get policy first.
	np := &netv1.NetworkPolicy{}
	if err := e.kc.Get(ctx, client.ObjectKey{
		Namespace: ns,
		Name:      pname,
	}, np); err != nil {
		if apierrors.IsNotFound(err) {
			// Create a new one.
			pl := generateNetworkPolicyCR(pname, ns)
			if err := e.kc.Create(ctx, pl); err != nil {
				return errors.Wrapf(err, "create network policy: %s", pname)
			}
			return nil
		}

		return errors.Wrapf(err, "get network policy: %s", pname)
	}

	// It does exist.
	return nil
}

// removeNetworkPolicy removes the network policy.
func (e *Enforcer) removeNetworkPolicy(ctx context.Context, ns string) error {
	pname := fmt.Sprintf("%s-%s", networkPolicyNamePrefix, ns)

	// List all the pods under the namespace.
	pol := &corev1.PodList{}
	if err := e.kc.List(ctx, pol, client.InNamespace(ns), client.MatchingLabels{
		matchPodLabelCtrl: cnsiVendor,
		matchPodLabelRisk: risky,
	}); err != nil {
		return errors.Wrapf(err, "list pods under namespace: %s", ns)
	}

	if len(pol.Items) == 0 {
		// No controlled items left, remove the policy.
		// Get it first.
		np := &netv1.NetworkPolicy{}
		if err := e.kc.Get(ctx, client.ObjectKey{
			Namespace: ns,
			Name:      pname,
		}, np); err != nil {
			return errors.Wrapf(err, "get network policy %s:%s", ns, pname)
		}

		// Remove it.
		if err := e.kc.Delete(ctx, np); err != nil {
			return errors.Wrapf(err, "remove network policy %s:%s", ns, pname)
		}
	}

	return nil
}

func generateNetworkPolicyCR(name string, ns string) *netv1.NetworkPolicy {
	return &netv1.NetworkPolicy{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: ns,
			Annotations: map[string]string{
				annotationPolicyRole:   denyAllRole,
				annotationPolicyVendor: cnsiVendor,
			},
		},
		Spec: netv1.NetworkPolicySpec{
			PolicyTypes: []netv1.PolicyType{
				netv1.PolicyTypeIngress,
				netv1.PolicyTypeEgress,
			},
			PodSelector: metav1.LabelSelector{
				MatchLabels: map[string]string{
					matchPodLabelCtrl: cnsiVendor,
					matchPodLabelRisk: risky,
				},
			},
		},
	}
}
