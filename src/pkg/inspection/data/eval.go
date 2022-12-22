package data

import (
	"fmt"
	"github.com/goark/go-cvss/v3/metric"
	"github.com/goharbor/harbor/src/pkg/scan/vuln"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
)

// Evaluator Interface
type Evaluator interface {
	Eval(*ResourceItem, *Workloads, *vuln.Report) []*RiskItem
}

// DefaultEvaluator the default evaluator for image risk evaluation
type DefaultEvaluator struct {
	bm *metric.Base
}

// NewDefaultEvaluator the new evaluator
func NewDefaultEvaluator() *DefaultEvaluator {
	bm := metric.NewBase()
	return &DefaultEvaluator{bm: bm}
}

// Eval the default the eval function
func (d *DefaultEvaluator) Eval(i *ResourceItem, w *Workloads, report *vuln.Report) (risks []*RiskItem) {
	for _, v := range report.Vulnerabilities {
		d.getExposureRisk(i, w, v)
		d.getPrivilegeRisk(i, w, v)
		d.getSeriousVulnerability(i, w, v)
	}

	return
}

func (d *DefaultEvaluator) getExposureRisk(i *ResourceItem, w *Workloads, v *vuln.VulnerabilityItem) {
	if v.CVSSDetails.VectorV3 != "" {
		if _, err := d.bm.Decode(v.CVSSDetails.VectorV3); err == nil {
			e := metric.GetModifiedAttackVector(v.CVSSDetails.VectorV3)
			if e == metric.ModifiedAttackVectorNetwork {
				if related := w.GetWorkloads(&ResourceSelector{
					Category:  "Service",
					Selectors: i.Pod.Labels,
				}, ""); len(related) != 0 {
					w.AddRiskItem(i.ID, &RiskItem{
						Score: v.Severity.Code(),
						Scale: vuln.Critical.Code(),
						Reason: fmt.Sprintf("resource %s is exposed to network while it has "+
							"vulneratbility %s(severity: %d) with network exposure", i.ID, v.ID, v.Severity.Code()),
					})
				}
			}
		} else {
			log.Errorf("error to decode %s \n", v.CVSSDetails.VectorV3)
		}
	}

	return
}

func (d *DefaultEvaluator) getSeriousVulnerability(i *ResourceItem, w *Workloads, v *vuln.VulnerabilityItem) {
	if v != nil && v.Severity.Code() >= vuln.Medium.Code() {
		w.AddRiskItem(i.ID, &RiskItem{
			Score:  v.Severity.Code() - vuln.Low.Code(),
			Scale:  vuln.Critical.Code() - vuln.Low.Code(),
			Reason: fmt.Sprintf("%s with severity: %s", v.ID, v.Severity),
			VulnerabilityRiskItem: &VulnerabilityRiskItem{
				InfectionVectors: v.CVSSDetails.VectorV3,
				Package:          v.Package,
				Version:          v.Version,
				FixVersion:       v.FixVersion,
				Description:      v.Description,
			},
		})
	}

	return
}

func (d *DefaultEvaluator) getPrivilegeRisk(i *ResourceItem, w *Workloads, v *vuln.VulnerabilityItem) {
	if v.CVSSDetails.VectorV3 != "" {
		if _, err := d.bm.Decode(v.CVSSDetails.VectorV3); err == nil {
			e := metric.GetModifiedPrivilegesRequired(v.CVSSDetails.VectorV3)
			if e == metric.ModifiedPrivilegesRequiredLow {
				if related := w.GetWorkloads(&ResourceSelector{
					Category:  "Service",
					Selectors: i.Pod.Labels,
				}, ""); len(related) != 0 {
					w.AddRiskItem(i.ID, &RiskItem{
						Score: v.Severity.Code(),
						Scale: vuln.Critical.Code(),
						Reason: fmt.Sprintf("resource %s is exposed to low privilege-required vulnerability"+
							"%s(severity: %d)", i.ID, v.ID, v.Severity.Code()),
					})
				}
			}
		} else {
			log.Errorf("error to decode %s \n", v.CVSSDetails.VectorV3)
		}
	}

	return
}
