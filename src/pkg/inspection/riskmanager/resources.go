package riskmanager

import (
	"github.com/goharbor/harbor/src/pkg/scan/vuln"
	v1 "k8s.io/api/core/v1"
)

// ResourceItem the resource item is to list all the resource is relating the ImageItem
type ResourceItem struct {
	ID   string `json:"uuid"`
	Type string `json:"type"`
	*v1.Pod
	*v1.Service
	*v1.Node
	*v1.ServiceAccount
	*v1.Secret
}

// NewResourceItem create a new resource item given one of the source item
func NewResourceItem(pod *v1.Pod, service *v1.Service, node *v1.Node, serviceAccount *v1.ServiceAccount, secret *v1.Secret) *ResourceItem {
	r := &ResourceItem{Pod: pod, Service: service,
		Node: node, ServiceAccount: serviceAccount, Secret: secret}

	r.generateUUID()
	return r
}

// UUID get uuid
func (r *ResourceItem) UUID() string {
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
		for _, i := range r.Pod.Spec.Containers {
			images = append(images, NewImageItem(i.Image))
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

func (r *ResourceItem) generateUUID() {
	//TODO generate the uuid given different type resources
	uuid := ""
	r.ID = uuid
}

// ImageItem the image item get from the work load
type ImageItem struct {
	ID        string          `json:"uuid"`
	ImageName string          `json:"image"`
	Related   []*ResourceItem `json:"related"`
	Reports   []*vuln.Report
}

// NewImageItem new image item
func NewImageItem(containerImage string) *ImageItem {
	i := &ImageItem{ImageName: containerImage}
	i.generateUUID()

	return i
}

// UUID uuid
func (i *ImageItem) UUID() string {
	return i.ID
}

func (i *ImageItem) generateUUID() {
	//TODO generate the uuid given different type resources
	uuid := ""
	i.ID = uuid
}

// FetchHarborReport fetch the harbor report
func (i *ImageItem) FetchHarborReport() error {
	//TODO fetch reports from harbor
	return nil
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
