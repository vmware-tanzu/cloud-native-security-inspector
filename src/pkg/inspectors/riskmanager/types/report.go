package types

import riskdata "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspectors/riskmanager/data"

type RiskDetail struct {
	Detail          []*riskdata.RiskItem
	Kind            string `json:"kind"`
	Name            string `json:"name"`
	Namespace       string `json:"namespace"`
	Uid             string `json:"uid"`
	CreateTimestamp string `json:"createTime"`
}

type RiskReport struct {
	ReportDetail    []RiskDetail
	CreateTimestamp string `json:"createTime"`
	DocID           string `json:"docID"`
}
