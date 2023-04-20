package trivy

import (
	"time"

	trivy "github.com/aquasecurity/trivy/pkg/types"
)

var report trivy.Report

const SchemaVersion = 2

type LicenseScanReport struct {
	SchemaVersion            int    `json:"SchemaVersion"`
	ArtifactName             string `json:"ArtifactName"`
	ArtifactType             string `json:"ArtifactType"`
	MetadataMisconfiguration `json:"Metadata"`
	Result                   []Results `json:"Results"`
}

type MetadataMisconfiguration struct {
	OS       `json:"OS"`
	RepoTags []RepoTags `json:"RepoTags"`
}

type OS struct {
	Family string `json:"Family"`
	Name   string `json:"Name"`
}
type RepoTags string

type Results struct {
	Target       string              `json:"Target"`
	Class        string              `json:"Class"`
	Type         string              `json:"Type"`
	MisconfigSum MisconfSummary      `json:"MisconfSummary"`
	Misconf      []Misconfigurations `json:"Misconfigurations"`
	License      []License           `json:"Licenses"`
}

type License struct {
	Severity   string `json:"Severity"`
	Category   string `json:"Category"`
	PkgName    string `json:"PkgName"`
	FilePath   string `json:"FilePath"`
	Name       string `json:"Name"`
	Confidence int    `json:"Confidence"`
	Link       string `json:"Link"`
}

type MisconfSummary struct {
	Successes  int `json:"Successes"`
	Failures   int `json:"Failures"`
	Exceptions int `json:"Exceptions"`
}

type Misconfigurations struct {
	Type        string        `json:"Link"`
	ID          string        `json:"Link"`
	AVDID       string        `json:"Link"`
	Title       string        `json:"Link"`
	Description string        `json:"Link"`
	Message     string        `json:"Link"`
	Namespace   string        `json:"Link"`
	Query       string        `json:"Link"`
	Resolution  string        `json:"Link"`
	Severity    string        `json:"Link"`
	PrimaryURL  string        `json:"Link"`
	Reference   []Reference   `json:"Link"`
	Status      string        `json:"Link"`
	Layer       ImageLayer    `json:"Layer"`
	Cause       CauseMetadata `json:"CauseMetadata"`
}

type Reference string

type ImageLayer struct {
	DiffID string `json:"DiffID"`
}

type CauseMetadata struct {
	Provider  string `json:"Provider"`
	Service   string `json:"Service"`
	StartLine int    `json:"Startline"`
	EndLine   int    `json:"EndLine"`
	Code      Code   `json:"Code"`
}
type Code struct {
	Lines []Lines `json:"Lines"`
}

type Lines struct {
	Number     int    `json:"Number"`
	Content    string `json:"Content"`
	IsCause    bool   `json:"IsCause"`
	Annotation string `json:"Annotation"`
	Truncated  bool   `json:"Truncated"`
	FirstCause bool   `json:"FirstCause"`
	LastCause  bool   `json:"LastCause"`
}

type ScanReport struct {
	SchemaVersion int
	Results       []ScanResult `json:"Results"`
}

type ScanResult struct {
	Target          string          `json:"Target"`
	Vulnerabilities []Vulnerability `json:"Vulnerabilities"`
}

type Metadata struct {
	NextUpdate time.Time `json:"NextUpdate"`
	UpdatedAt  time.Time `json:"UpdatedAt"`
}

type VersionInfo struct {
	Version         string    `json:"Version,omitempty"`
	VulnerabilityDB *Metadata `json:"VulnerabilityDB"`
}

type Layer struct {
	Digest string `json:"Digest"`
	DiffID string `json:"DiffID"`
}

type CVSSInfo struct {
	V2Vector string   `json:"V2Vector,omitempty"`
	V3Vector string   `json:"V3Vector,omitempty"`
	V2Score  *float32 `json:"V2Score,omitempty"`
	V3Score  *float32 `json:"V3Score,omitempty"`
}

type Vulnerability struct {
	VulnerabilityID  string              `json:"VulnerabilityID"`
	PkgName          string              `json:"PkgName"`
	InstalledVersion string              `json:"InstalledVersion"`
	FixedVersion     string              `json:"FixedVersion"`
	Title            string              `json:"Title"`
	Description      string              `json:"Description"`
	Severity         string              `json:"Severity"`
	References       []string            `json:"References"`
	PrimaryURL       string              `json:"PrimaryURL"`
	Layer            *Layer              `json:"Layer"`
	CVSS             map[string]CVSSInfo `json:"CVSS"`
	CweIDs           []string            `json:"CweIDs"`
}
