package data

import (
	"github.com/goharbor/harbor/src/lib/log"
	"k8s.io/apimachinery/pkg/labels"
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
	Privileges         []string `json:"privileges"`
	HostConfigurations []string `json:"host_configurations"`
}

// VulnerabilityRiskItem risky vulnerability items
type VulnerabilityRiskItem struct {
	POCReferences    []string `json:"poc_references"`
	InfectionVectors string   `json:"infection_vectors"`
	// An operating system or software dependency package containing the vulnerability.
	// e.g: dpkg
	Package string `json:"package"`
	// The version of the package containing the vulnerability.
	// e.g: 1.17.27
	Version string `json:"version"`
	// The version of the package containing the fix if available.
	// e.g: 1.18.0
	FixVersion string `json:"fix_version"`
	// example: dpkg-source in dpkg 1.3.0 through 1.18.23 is able to use a non-GNU patch program
	// and does not offer a protection mechanism for blank-indented diff hunks, which allows remote
	// attackers to conduct directory traversal attacks via a crafted Debian source package, as
	// demonstrated by using of dpkg-source on NetBSD.
	Description string `json:"description"`
}

// ExposureRiskItem exposure risk item
type ExposureRiskItem struct {
	Addresses []string `json:"addresses"`
}

// ComplianceRiskItem  risk item
type ComplianceRiskItem struct {
	ComplianceRisks []string `json:"compliance_risks"`
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
		if _, ok = w.Risks[id]; ok {
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
		for _, item := range w.Items {
			rs = append(rs, item)
		}
		rs = w.matchLabel(rs, selector.Selectors)
		rs = w.matchCategory(rs, selector.Category)
	} else if uuid != "" {
		for _, v := range w.Items {
			if v.UUID() == uuid {
				rs = append(rs, v)
			}
		}
	}

	return
}

//func (w *Workloads) generateAssessReport() (a api.AssessmentReport) {
//	//TODO generate the AssessmentReport @jinpeng
//	return
//}

// ExportAssessmentDetails export the assessment report
//func (w *Workloads) ExportAssessmentDetails(e *consumers.OpenSearchExporter) error {
//	return e.SaveRiskReport(w.Risks)
//}

// ExportAssessmentReports export the assessment report
//func (w *Workloads) ExportAssessmentReports(e *consumers.OpenSearchExporter) error {
//	r := w.generateAssessReport()
//	return e.Save(r)
//}

// matchLabel match label
func (w *Workloads) matchLabel(rs []*ResourceItem, selectorLabel map[string]string) (fit []*ResourceItem) {
	if len(selectorLabel) == 0 {
		return rs
	}

	for _, item := range rs {
		if len(item.Selector) == 0 {
			continue
		}
		sel := labels.SelectorFromValidatedSet(item.Selector)
		lbs := labels.Set(selectorLabel)
		if !sel.Matches(lbs) {
			continue
		}
		fit = append(fit, item)
	}

	return fit
}

// matchCategory match category
func (w *Workloads) matchCategory(rs []*ResourceItem, selectorCategory string) (fit []*ResourceItem) {
	if selectorCategory == "" {
		return rs
	}

	for _, item := range rs {
		if item.Type != selectorCategory {
			continue
		}
		fit = append(fit, item)
	}

	return fit
}
