package consumers

import (
	"github.com/aquasecurity/kube-bench/check"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspection/data"
)

type ContainerInfo struct {
	ContainerId      string `json:"containerId"`
	ContainerName    string `json:"containerName"`
	ContainerImage   string `json:"containerImage"`
	ContainerImageId string `json:"containerImageId"`
	IsInit           string `json:"isInit"`
}

type ReportInfo struct {
	UID                     string `json:"reportUID"`
	CreateTimestamp         string `json:"createTime"`
	InspectionConfiguration string `json:"inspectionConfiguration"`
}

type WorkloadInfo struct {
	Kind              string `json:"kind"`
	WorkloadName      string `json:"workloadName"`
	Namespace         string `json:"workloadNamespace"`
	ActionEnforcement string `json:"actionEnforcement"`
	Passed            string `json:"passed"`
	Failures          string `json:"failures"`
}

type AssessmentReportDoc struct {
	// DocId is unique ID of the document for ES. container_name + container_id + assessment_report_name
	DocId string `json:"docId"`
	// Container info for each container in the cluster
	ContainerInfo
	// Workload is the info of the workload which the container belongs to
	WorkloadInfo
	// Report is the info of the assessment report which contains the scanning result of this container
	ReportInfo
}

type CISReport struct {
	check.Controls
	CreateTimestamp string `json:"createTime"`
	NodeName        string `json:"node_name"`
}

//type Controls struct {
//	ID              string   `yaml:"id" json:"id"`
//	Version         string   `json:"version"`
//	DetectedVersion string   `json:"detected_version,omitempty"`
//	Text            string   `json:"text"`
//	Type            NodeType `json:"node_type"`
//	Groups          []*Group `json:"tests"`
//	Summary
//}

type RiskDetail struct {
	Detail          []*data.RiskItem
	Kind            string `json:"kind"`
	Name            string `json:"name"`
	Namespace       string `json:"namespace"`
	Uid             string `json:"uid"`
	CreateTimestamp string `json:"createTime"`
}

type RiskReport struct {
	ReportDetail    []RiskDetail
	CreateTimestamp string `json:"createTime"`
}
