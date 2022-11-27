package riskmanager

import (
	"github.com/goharbor/harbor/src/lib/log"
	api "github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	consumers "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/opensearch"
)

// ResourceSelector resource selector
type ResourceSelector struct {
	Category  string
	Selectors map[string]string
}

// Workload the workload
type Workload interface {
	UUID() string
	GenerateReportItems() ([]*RiskItem, error)
	GetWorkload() ResourceItem
}

// RiskItem the detail of the risk item
type RiskItem struct {
	Score                  int    `json:"score,omitempty"`  //risk score
	Scale                  int    `json:"scale,omitempty"`  //risk scale(maximum)
	Reason                 string `json:"reason,omitempty"` //reason of the risk
	*HostRiskItem          `json:"host,omitempty"`
	*VulnerabilityRiskItem `json:"vuln,omitempty"`
	*ExposureRiskItem      `json:"exposure,omitempty"`
	*ComplianceRiskItem    `json:"compliance,omitempty"`
}

// HostRiskItem risky host configuration and privilege misuses
type HostRiskItem struct {
	Privileges         []string
	HostConfigurations []string
}

// VulnerabilityRiskItem risky vulnerability items
type VulnerabilityRiskItem struct {
	POCReferences    []string
	InfectionVectors string
}

// ExposureRiskItem exposure risk item
type ExposureRiskItem struct {
	Addresses []string
}

// ComplianceRiskItem  risk item
type ComplianceRiskItem struct {
	ComplianceRisks []string
}

// RiskCollection generate all risk items summary for all workloads
type RiskCollection map[string][]*RiskItem

// Workloads the workloads in the cluster
type Workloads struct {
	Items map[string]*ResourceItem `json:"items"`
	Risks RiskCollection           `json:"risks"`
}

// NewWorkloads  new workloads summary
func NewWorkloads(risks RiskCollection, w map[string]*ResourceItem) *Workloads {
	return &Workloads{Risks: risks, Items: w}
}

// AddResource add resource
func (w *Workloads) AddResource(r *ResourceItem) {
	if r != nil {
		w.Items[r.UUID()] = r
	}

	return
}

// AddRiskItem add risk item for workload
func (w *Workloads) AddRiskItem(id string, r *RiskItem) {
	if _, ok := w.Items[id]; ok {
		if _, ok := w.Risks[id]; ok {
			w.Risks[id] = append(w.Risks[id], r)
		} else {
			w.Risks[id] = []*RiskItem{r}
		}
	} else {
		log.Errorf("%s is not in workload list", id)
	}

	return
}

// GetWorkloads given either a selector or uuid name
func (w *Workloads) GetWorkloads(selector *ResourceSelector, uuid string) (rs []*ResourceItem) {
	if selector != nil {
		//TODO @jinpeng
	} else if uuid != "" {
		for _, v := range w.Items {
			if v.UUID() == uuid {
				rs = append(rs, v)
			}
		}
	}

	return
}

func (w *Workloads) generateAssessReport() (a api.AssessmentReport) {
	//TODO generate the AssessmentReport @jinpeng
	return
}

// ExportAssessmentDetails export the assessment report
func (w *Workloads) ExportAssessmentDetails(e *consumers.OpenSearchExporter) error {
	return e.SaveRiskReport(w.Risks)
}

// ExportAssessmentReports export the assessment report
func (w *Workloads) ExportAssessmentReports(e *consumers.OpenSearchExporter) error {
	r := w.generateAssessReport()
	return e.Save(r)
}
