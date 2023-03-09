package data

import (
	"encoding/json"
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
	var vector string
	for _, v := range report.Vulnerabilities {
		vector = d.getVector(v)
		d.getExposureRisk(i, w, v, vector)
		d.getPrivilegeRisk(i, w, v, vector)
		d.getSeriousVulnerability(i, w, v, vector)
	}

	return
}

func (d *DefaultEvaluator) getExposureRisk(i *ResourceItem, w *Workloads, v *vuln.VulnerabilityItem, vector string) {
	if vector != "" {
		if bm, err := d.bm.Decode(vector); err == nil {
			e := metric.GetModifiedAttackVector(bm.AV.String())
			if e == metric.ModifiedAttackVectorNetwork {
				if related := w.GetWorkloads(&ResourceSelector{
					Category:  "Service",
					Selectors: i.Pod.Labels,
				}, ""); len(related) != 0 {
					w.AddRiskItem(i.ID, &RiskItem{
						Score: v.Severity.Code(),
						Scale: vuln.Critical.Code(),
						Reason: fmt.Sprintf("resource %s is exposed to network while it has "+
							"vulneratbility %s (severity: %d) with network exposure", i.ID, v.ID, v.Severity.Code()),
						VulnerabilityRiskItem: &VulnerabilityRiskItem{
							InfectionVectors: vector,
							Package:          v.Package,
							Version:          v.Version,
							FixVersion:       v.FixVersion,
							Description:      v.Description,
						},
					})
				}
			}
		} else {
			log.Errorf("error to decode %s \n", vector)
		}
	}

	return
}

func (d *DefaultEvaluator) getSeriousVulnerability(i *ResourceItem, w *Workloads, v *vuln.VulnerabilityItem, vector string) {
	if v != nil && v.Severity.Code() >= vuln.Medium.Code() {
		w.AddRiskItem(i.ID, &RiskItem{
			Score:  v.Severity.Code() - vuln.Low.Code(),
			Scale:  vuln.Critical.Code() - vuln.Low.Code(),
			Reason: fmt.Sprintf("%s with severity: %s", v.ID, v.Severity),
			VulnerabilityRiskItem: &VulnerabilityRiskItem{
				InfectionVectors: vector,
				Package:          v.Package,
				Version:          v.Version,
				FixVersion:       v.FixVersion,
				Description:      v.Description,
			},
		})
	}

	return
}

func (d *DefaultEvaluator) getPrivilegeRisk(i *ResourceItem, w *Workloads, v *vuln.VulnerabilityItem, vector string) {
	if vector != "" {
		if bm, err := d.bm.Decode(vector); err == nil {
			e := metric.GetModifiedPrivilegesRequired(bm.PR.String())
			if e == metric.ModifiedPrivilegesRequiredLow {
				if related := w.GetWorkloads(&ResourceSelector{
					Category:  "Service",
					Selectors: i.Pod.Labels,
				}, ""); len(related) != 0 {
					w.AddRiskItem(i.ID, &RiskItem{
						Score: v.Severity.Code(),
						Scale: vuln.Critical.Code(),
						Reason: fmt.Sprintf("resource %s is exposed to low privilege-required vulnerability"+
							" %s (severity: %d)", i.ID, v.ID, v.Severity.Code()),
						VulnerabilityRiskItem: &VulnerabilityRiskItem{
							InfectionVectors: vector,
							Package:          v.Package,
							Version:          v.Version,
							FixVersion:       v.FixVersion,
							Description:      v.Description,
						},
					})
				}
			}
		} else {
			log.Errorf("error to decode %s \n", vector)
		}
	}

	return
}

func (d *DefaultEvaluator) getVector(v *vuln.VulnerabilityItem) (vector string) {
	type Vendor struct {
		CVSS struct {
			Nvd struct {
				V3Score  float32 `json:"V3Score"`
				V3Vector string  `json:"V3Vector"`
			} `json:"nvd"`
			Redhat struct {
				V3Score  float32 `json:"V3Score"`
				V3Vector string  `json:"V3Vector"`
			} `json:"redhat"`
		} `json:"CVSS"`
	}

	marshal, err := json.Marshal(v.VendorAttributes)
	if err == nil {
		var vendor Vendor
		err = json.Unmarshal(marshal, &vendor)
		if err == nil {
			if vendor.CVSS.Nvd.V3Vector != "" {
				vector = vendor.CVSS.Nvd.V3Vector
			} else if vendor.CVSS.Redhat.V3Vector != "" {
				vector = vendor.CVSS.Redhat.V3Vector
			} else {
				log.Errorf("cve: %s no vector", v.ID)
			}
		}
	}

	return
}
