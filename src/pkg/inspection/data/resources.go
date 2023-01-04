package data

import (
	"context"
	"fmt"
	"github.com/goharbor/harbor/src/pkg/scan/vuln"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/core"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/providers"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ResourceItem the resource item is to list all the resource is relating the ImageItem
type ResourceItem struct {
	ID             string             `json:"uuid"`
	Type           string             `json:"type"`
	Pod            v1.Pod             `json:"pod,omitempty"`
	Service        v1.Service         `json:"service,omitempty"`
	Node           *v1.Node           `json:"node,omitempty"`
	ServiceAccount *v1.ServiceAccount `json:"service_account,omitempty"`
	Secret         *v1.Secret         `json:"secret,omitempty"`
	Deployment     appsv1.Deployment  `json:"deployment,omitempty"`
	Selector       map[string]string  `json:"selector,omitempty"`
	metav1.ObjectMeta
}

// NewResourceItem create a new resource item given one of the source item
func NewResourceItem(kind string) *ResourceItem {
	return &ResourceItem{Type: kind}
}

func (r *ResourceItem) SetPod(pod v1.Pod) {
	r.Pod = pod
	r.ObjectMeta = pod.ObjectMeta
}

func (r *ResourceItem) SetService(service v1.Service) {
	r.Service = service
	r.ObjectMeta = service.ObjectMeta
	r.Selector = service.Spec.Selector
}

func (r *ResourceItem) SetDeployment(deploy appsv1.Deployment) {
	r.Deployment = deploy
	r.ObjectMeta = deploy.ObjectMeta
	r.Selector = deploy.Spec.Selector.MatchLabels
}

func (r *ResourceItem) SetNode(node *v1.Node) {
	r.Node = node
	r.ObjectMeta = node.ObjectMeta
}

func (r *ResourceItem) SetSecret(secret *v1.Secret) {
	r.Secret = secret
	r.ObjectMeta = secret.ObjectMeta
}

func (r *ResourceItem) SetServiceAccount(serviceAccount *v1.ServiceAccount) {
	r.ServiceAccount = serviceAccount
	r.ObjectMeta = serviceAccount.ObjectMeta
}

// UUID get uuid
func (r *ResourceItem) UUID() string {
	if r.ID == "" {
		r.GenerateUUID()
	}
	return r.ID
}

func (r *ResourceItem) IsPod() bool {
	if r.Type == "Pod" && r.Pod.GetName() != "" {
		return true
	}

	return false
}

func (r *ResourceItem) IsService() bool {
	if r.Type == "Service" && r.Service.GetName() != "" {
		return true
	}

	return false
}

func (r *ResourceItem) IsDeployment() bool {
	if r.Type == "Deployment" && r.Deployment.GetName() != "" {
		return true
	}

	return false
}

func (r *ResourceItem) IsNode() bool {
	if r.Type == "Node" && r.Node != nil {
		return true
	}

	return false
}

func (r *ResourceItem) IsServiceAccount() bool {
	if r.Type == "ServiceAccount" && r.ServiceAccount != nil {
		return true
	}

	return false
}

func (r *ResourceItem) IsSecret() bool {
	if r.Type == "Secret" && r.Secret != nil {
		return true
	}

	return false
}

// GetImages get images from a pod
func (r *ResourceItem) GetImages() (images []*ImageItem) {

	//Only pod is added to image related items
	if r.IsPod() {
		for _, ct := range r.Pod.Status.ContainerStatuses {
			aid := core.ParseArtifactIDFrom(ct.Image, ct.ImageID)
			images = append(images, NewImageItem(ct.Image, aid))
		}
		for _, ct := range r.Pod.Status.InitContainerStatuses {
			aid := core.ParseArtifactIDFrom(ct.Image, ct.ImageID)
			images = append(images, NewImageItem(ct.Image, aid))
		}
	}

	return
}

// GenerateReportItems generate report Item
func (r *ResourceItem) GenerateReportItems(w *Workloads, report *vuln.Report, evaluator Evaluator) (rs []*RiskItem, e error) {
	rs = evaluator.Eval(r, w, report)
	return
}

// GenerateUUID generate uuid for all types of resource items
func (r *ResourceItem) GenerateUUID() {
	uid := fmt.Sprintf("%s:%s:%s:%s", r.Type, r.ObjectMeta.GetName(), r.ObjectMeta.GetNamespace(), string(r.ObjectMeta.GetUID()))
	r.ID = uid
}

// ImageItem the image item get from the work load
type ImageItem struct {
	ID         string          `json:"uuid"`
	ImageName  string          `json:"image"`
	ArtifactID core.ArtifactID `json:"artifact_id"`
	Related    []*ResourceItem `json:"related"`
	Reports    []*vuln.Report
}

// NewImageItem new image item
func NewImageItem(containerImage string, ArtifactID core.ArtifactID) *ImageItem {
	i := &ImageItem{ImageName: containerImage, Related: []*ResourceItem{}, ArtifactID: ArtifactID}
	i.generateUUID()

	return i
}

// UUID uuid
func (i *ImageItem) UUID() string {
	if i.ID == "" {
		i.generateUUID()
	}
	return i.ID
}

func (i *ImageItem) generateUUID() {
	u := i.ArtifactID.String()
	i.ID = u
}

// FetchHarborReport fetch the harbor report
func (i *ImageItem) FetchHarborReport(Adapter providers.Adapter) (*vuln.Report, error) {
	ctx := context.Background()
	report, err := Adapter.GetVulnerabilitiesList(ctx, i.ArtifactID)
	if err != nil {
		return nil, err
	}
	return report, nil
}

// AddRelatedResource add resource
func (i *ImageItem) AddRelatedResource(v *ResourceItem) {
	i.Related = append(i.Related, v)
	return
}
