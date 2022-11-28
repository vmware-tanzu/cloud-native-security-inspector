package network

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	netv1 "k8s.io/api/networking/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var _ = Describe("Network Policy Enforcer", func() {
	var (
		ctx          context.Context
		fakeClient   *ClientMock
		fakeEnforcer *Enforcer
		err          error

		workload          *v1alpha1.Workload
		workloadPods      []string
		workloadNamespace string

		fakeManagedPod         = "fake-managed-pod"
		fakeUnManagedPod       = "fake-unmanaged-pod"
		fakeNamespace1         = "namespace1" //assume defualt policy exists in namespace1 already
		fakeNamespace2         = "namespace2"
		fakedefaultPolicyName1 = fmt.Sprintf("%s-%s", networkPolicyNamePrefix, fakeNamespace1)
		fakedefaultPolicyName2 = fmt.Sprintf("%s-%s", networkPolicyNamePrefix, fakeNamespace2)
		fakePodName1           = "fakepod1"
		fakePodName2           = "fakepod2"

		fakePod           *corev1.Pod
		fakeNetworkPolicy *netv1.NetworkPolicy

		denyAllPolicy = netv1.NetworkPolicySpec{
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
		}
	)

	BeforeEach(func() {
		var (
			fakePodMap = map[string]*corev1.Pod{
				fakeManagedPod: {
					ObjectMeta: metav1.ObjectMeta{
						Name:      fakePodName1,
						Namespace: fakeNamespace1,
						Labels: map[string]string{
							matchPodLabelCtrl: cnsiVendor,
							matchPodLabelRisk: risky,
						},
					},
				},
				fakeUnManagedPod: {
					ObjectMeta: metav1.ObjectMeta{
						Name:      fakePodName2,
						Namespace: fakeNamespace2,
						Labels:    map[string]string{},
					},
				},
			}

			fakePolicyMap = map[string]*netv1.NetworkPolicy{
				fakedefaultPolicyName1: {
					ObjectMeta: metav1.ObjectMeta{
						Name:      fakedefaultPolicyName1,
						Namespace: fakeNamespace1,
						Annotations: map[string]string{
							annotationPolicyRole:   denyAllRole,
							annotationPolicyVendor: cnsiVendor,
						},
					},
					Spec: denyAllPolicy,
				},
			}
		)
		fakePod = &corev1.Pod{}
		fakeClient = &ClientMock{}
		fakeNetworkPolicy = &netv1.NetworkPolicy{}
		fakeClient.GetFunc = func(ctx context.Context, key types.NamespacedName, obj client.Object) error {
			if po, ok := fakePodMap[key.Name]; ok {
				obj.SetName(po.Name)
				obj.SetNamespace(po.Name)
				obj.SetLabels(po.Labels)
				return nil
			}
			if np, ok := fakePolicyMap[key.Name]; ok {
				obj.SetName(np.Name)
				obj.SetAnnotations(np.Annotations)
				obj.SetNamespace(np.Namespace)
				return nil
			}
			return apierrors.NewNotFound(schema.GroupResource{}, key.Name)
		}
		fakeClient.UpdateFunc = func(ctx context.Context, obj client.Object, opts ...client.UpdateOption) error {

			fakePod = obj.DeepCopyObject().(*corev1.Pod)
			return nil
		}
		fakeClient.CreateFunc = func(ctx context.Context, obj client.Object, opts ...client.CreateOption) error {
			if strings.HasPrefix(obj.GetName(), networkPolicyNamePrefix) {
				//network policy
				fmt.Println("np")
				str, _ := json.Marshal(obj)
				fmt.Println(string(str))
				fakeNetworkPolicy = obj.DeepCopyObject().(*netv1.NetworkPolicy)
			}
			return nil
		}
		fakeClient.ListFunc = func(ctx context.Context, list client.ObjectList, opts ...client.ListOption) error {
			// hack: always return nil
			return nil
		}
		fakeClient.DeleteFunc = func(ctx context.Context, obj client.Object, opts ...client.DeleteOption) error {
			//hack: return "removed" for testing
			if _, ok := fakePolicyMap[obj.GetName()]; ok {
				return fmt.Errorf("removed")
			}
			return fmt.Errorf("remove failed")
		}
		fakeEnforcer = New().UseClient(fakeClient).WithScheme(runtime.NewScheme())
	})

	JustBeforeEach(func() {
		workload = constructWorkLoad(workloadPods, workloadNamespace)
	})

	Describe("Enforce", func() {
		JustBeforeEach(func() {
			err = fakeEnforcer.Enforce(ctx, workload)
		})

		Context("enforce policy in namespace without default policy", func() {
			BeforeEach(func() {
				workloadPods = []string{fakeUnManagedPod}
				workloadNamespace = fakeNamespace2
			})

			It("default policy should be created and pod label should be updated", func() {
				Expect(fakeNetworkPolicy.Name).To(Equal(fakedefaultPolicyName2))
				Expect(fakeNetworkPolicy.Namespace).To(Equal(fakeNamespace2))
				Expect((fakeNetworkPolicy.Spec)).To(Equal(denyAllPolicy))

				Expect(fakePod.Labels).To(Equal(map[string]string{
					matchPodLabelCtrl: cnsiVendor,
					matchPodLabelRisk: risky,
				}))
				Expect(err).NotTo(HaveOccurred())
			})
		})

		Context("enforce policy in namespace with default policy exists", func() {
			BeforeEach(func() {
				workloadPods = []string{fakeUnManagedPod}
				workloadNamespace = fakeNamespace1
			})

			It("pod label should be updated", func() {
				Expect(fakePod.Labels).To(Equal(map[string]string{
					matchPodLabelCtrl: cnsiVendor,
					matchPodLabelRisk: risky,
				}))
				Expect(err).NotTo(HaveOccurred())
			})
		})

		Context("nil workload", func() {
			JustBeforeEach(func() {
				err = fakeEnforcer.Enforce(ctx, nil)
			})

			It("should return false", func() {
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("empty workload for enforcing policy"))
			})
		})
	})

	Describe("Revoke", func() {
		JustBeforeEach(func() {
			err = fakeEnforcer.Revoke(ctx, workload)
		})

		Context("delete labels for managed pod", func() {
			BeforeEach(func() {
				workloadPods = []string{fakeManagedPod}
				workloadNamespace = fakeNamespace1
			})

			It("pod label should be deleted and policy should be removed", func() {
				Expect(fakeNetworkPolicy).To(Equal(&netv1.NetworkPolicy{}))

				Expect(fakePod.Labels).To(Equal(map[string]string{}))
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("removed"))
			})
		})

		Context("nil workload", func() {
			JustBeforeEach(func() {
				err = fakeEnforcer.Revoke(ctx, nil)
			})

			It("should return false", func() {
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("empty workload for revoking policy"))
			})
		})
	})

	Describe("IsManaged", func() {
		var (
			isManaged bool
		)

		JustBeforeEach(func() {
			isManaged, err = fakeEnforcer.IsManaged(ctx, workload)
		})

		Context("managed workload", func() {
			BeforeEach(func() {
				workloadPods = []string{fakeManagedPod}
				workloadNamespace = fakeNamespace1
			})

			It("should return true", func() {
				Expect(err).ToNot(HaveOccurred())
				Expect(isManaged).To(Equal(true))
			})
		})

		Context("unmanaged workload", func() {
			BeforeEach(func() {
				workloadPods = []string{fakeUnManagedPod}
				workloadNamespace = fakeNamespace2
			})

			It("should return false", func() {
				Expect(err).ToNot(HaveOccurred())
				Expect(isManaged).To(Equal(false))
			})
		})

		Context("nil workload", func() {
			JustBeforeEach(func() {
				isManaged, err = fakeEnforcer.IsManaged(ctx, nil)
			})

			It("should return false", func() {
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("empty workload for checking policy managed status"))
			})
		})
	})
})

func constructWorkLoad(podNames []string, ns string) *v1alpha1.Workload {
	workload := &v1alpha1.Workload{}
	workload.Namespace = ns
	for _, name := range podNames {
		workload.Pods = append(workload.Pods, &v1alpha1.Pod{
			ObjectReference: corev1.ObjectReference{
				Namespace: ns,
				Name:      name,
			},
		})
	}
	return workload
}
