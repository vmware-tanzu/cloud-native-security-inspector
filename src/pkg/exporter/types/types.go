package types

type Configuration struct {
	OpenSearch OpensearchOutputConfig `json:"openSearch,omitempty"`
	// Extend this struct for more consumers
}

type OpensearchOutputConfig struct {
	HostPort  string `json:"host_port"`
	Index     string `json:"index"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	CheckCert bool   `json:"checkCert"`
	MutualTLS bool   `json:"mutualTLS"`
}

type ReportData struct {
	Config  Configuration `json:"config"`
	Payload string        `json:"payload"`
}
