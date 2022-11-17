package consumers

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
