package riskmanager

import (
	"context"
	"github.com/goharbor/harbor/src/pkg/scan/vuln"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/core"
	"github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/providers"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	"log"
)

// ResourceItem the resource item is to list all the resource is relating the ImageItem
type ResourceItem struct {
	ID             string             `json:"uuid"`
	Type           string             `json:"type"`
	Pod            *v1.Pod            `json:"pod,omitempty"`
	Service        *v1.Service        `json:"service,omitempty"`
	Node           *v1.Node           `json:"node,omitempty"`
	ServiceAccount *v1.ServiceAccount `json:"service_account,omitempty"`
	Secret         *v1.Secret         `json:"secret,omitempty"`
	Deployment     *appsv1.Deployment `json:"deployment,omitempty"`
}

// NewResourceItem create a new resource item given one of the source item
func NewResourceItem(kind string) *ResourceItem {
	r := &ResourceItem{Type: kind}
	return r
}

func (r *ResourceItem) SetPod(pod *v1.Pod) {
	r.Pod = pod
}

func (r *ResourceItem) SetService(service *v1.Service) {
	r.Service = service
}

func (r *ResourceItem) SetDeployment(deploy *appsv1.Deployment) {
	r.Deployment = deploy
}

func (r *ResourceItem) SetNode(node *v1.Node) {
	r.Node = node
}

func (r *ResourceItem) SetSecret(secret *v1.Secret) {
	r.Secret = secret
}

func (r *ResourceItem) SetServiceAccount(serviceAccount *v1.ServiceAccount) {
	r.ServiceAccount = serviceAccount
}

// UUID get uuid
func (r *ResourceItem) UUID() string {
	if r.ID == "" {
		r.GenerateUUID()
	}
	return r.ID
}

func (r *ResourceItem) IsPod() bool {
	if r.Type == "Pod" && r.Pod != nil {
		return true
	}

	return false
}

// GetImages get images from a pod
func (r *ResourceItem) GetImages() (images []*ImageItem) {
	if r.IsPod() {
		for _, ct := range r.Pod.Status.ContainerStatuses {
			aid := core.ParseArtifactIDFrom(ct.Image, ct.ImageID)
			log.Default().Printf("ArtifactID: %s", aid.String())
			images = append(images, NewImageItem(ct.Image, aid))
		}
		for _, ct := range r.Pod.Status.InitContainerStatuses {
			aid := core.ParseArtifactIDFrom(ct.Image, ct.ImageID)
			images = append(images, NewImageItem(ct.Image, aid))
		}
	}

	//TODO for other resource, need to correlating the image string with the resource
	// deployment <-> image
	// service <-> image
	// secret <-> image
	// persistence <-> image
	// node <-> image
	// etc

	return
}

// GenerateReportItems generate report Item
func (r *ResourceItem) GenerateReportItems() (rs []*RiskItem, e error) {
	//TODO implement me
	return
}

func (r *ResourceItem) GenerateUUID() {
	//TODO generate the uuid given different type resources
	uuid := ""
	r.ID = uuid
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
	return i.ID
}

func (i *ImageItem) generateUUID() {
	//TODO generate the uuid given different type resources
	uuid := i.ImageName
	i.ID = uuid
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

// IsVulnerable make verdict for image whether it is affected by the vulnerabilities
func (i *ImageItem) IsVulnerable(cves []string) bool {
	//TODO given a list of cves make verdict whether the image is vulnerable or not
	return false
}

// GenerateReportItem generate the report for open
func (i *ImageItem) GenerateReportItem() error {
	//TODO fetch the image scan reports from the Harbor service

	return nil
}
