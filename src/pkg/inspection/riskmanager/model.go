package riskmanager

import (
	api "github.com/vmware-tanzu/cloud-native-security-inspector/api/v1alpha1"
	consumers "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/opensearch"
)

// Workload the workload
type Workload interface {
	UUID() string
	GenerateReportItems() ([]*RiskItem, error)
	GetWorkload() ResourceItem
}

// RiskItem the detail of the risk item
type RiskItem struct {
	Score                  int
	Scale                  int
	Passed                 bool
	Reason                 string
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

func (r *RiskCollection) merge(items []*RiskItem) {
	//TODO merge risk items
	return
}

// Workloads the workloads in the cluster
type Workloads struct {
	Items map[string]Workload `json:"items"`
	Risks RiskCollection      `json:"risks"`
}

// NewWorkloads  new workloads summary
func NewWorkloads(risks RiskCollection, w map[string]Workload) *Workloads {
	return &Workloads{Risks: risks, Items: w}
}

// AddResource add resource
func (w *Workloads) AddResource(r *ResourceItem) {
	//TODO add resource to workloads
	return
}

func (w *Workloads) generateAssessReport() (a api.AssessmentReport) {
	//TODO generate the AssessmentReport
	return
}

func (w *Workloads) getRisks() {
	w.Risks = make(map[string][]*RiskItem)
	for _, v := range w.Items {
		if risks, err := v.GenerateReportItems(); err == nil {
			w.Risks.merge(risks)
		}
	}
}

// ExportAssessmentDetails export the assessment report
func (w *Workloads) ExportAssessmentDetails(e *consumers.OpenSearchExporter) error {
	return e.SaveRiskReport(w.Risks)
}

// ExportAssessmentReports export the assessment report
func (w *Workloads) ExportAssessmentReports(e *consumers.OpenSearchExporter) error {
	if w.Risks == nil {
		w.getRisks()
	}

	r := w.generateAssessReport()
	return e.Save(r)
}
