package consumers

type RiskReportInfo struct {
	CreateTimestamp string `json:"createTime"`
	Detail          string `json:"detail"`
}

type RiskReportDoc struct {
	// DocId is pod uuid
	DocId string `json:"docId"`
	RiskReportInfo
}
