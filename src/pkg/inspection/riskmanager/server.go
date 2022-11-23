package riskmanager

import (
	"github.com/gin-gonic/gin"
	consumers "github.com/vmware-tanzu/cloud-native-security-inspector/pkg/data/consumers/opensearch"
	"net/http"
)

// Status risk evaluation status
type Status struct {
	IsRunning bool  `json:"is_running"`
	Last      int64 `json:"last"`
}

// AnalyzeOption analyze option
type AnalyzeOption struct {
	DumpDetails      bool
	DumpAssessReport bool
	SkipImages       []string
}

// Server the server
type Server struct {
	Workloads          Workloads
	IsRunning          bool
	Images             map[string]*ImageItem
	Last               int64
	DetailExporter     *consumers.OpenSearchExporter
	AssessmentExporter *consumers.OpenSearchExporter
}

// NewServer new server instance
func NewServer(detailExporter *consumers.OpenSearchExporter, assessmentExporter *consumers.OpenSearchExporter) *Server {
	return &Server{DetailExporter: detailExporter, AssessmentExporter: assessmentExporter}
}

// postAlbums adds an album from JSON received in the request body.
func (s *Server) postResource(c *gin.Context) {
	var v ResourceItem

	// Call BindJSON to bind the received JSON to
	// newAlbum.
	if err := c.BindJSON(&v); err != nil {
		return
	}

	images := v.GetImages()
	for _, i := range images {
		if im, ok := s.Images[i.UUID()]; !ok {
			s.Images[i.UUID()] = im
		}

		s.Images[i.UUID()].AddRelatedResource(&v)
	}

	s.Workloads.AddResource(&v)

	c.IndentedJSON(http.StatusCreated, v)
}

func (s *Server) Analyze(option AnalyzeOption) {
	s.IsRunning = true
	defer func() {
		s.IsRunning = false
	}()

	var v RiskCollection
	for _, t := range s.Images {
		if err := t.FetchHarborReport(); err != nil {
			//TODO handle error
		} else {
			// TODO generate vulnerability risk
		}

		for _, r := range t.Related {
			var risks []*RiskItem
			if r.Type == "Service" {
				//TODO generate exposure risk
			} else if r.Type == "Deployment" {
				//TODO generate host risk
			} else if r.Type == "Node" {
				//TODO generate compliance risk
			} else if r.Type == "Pod" {
				//TODO generate compliance risk
			}

			if s, ok := v[r.UUID()]; !ok {
				v[r.UUID()] = risks
			} else {
				s = append(s, risks...)
			}
		}
	}

	s.Workloads.Risks = v
	if option.DumpAssessReport {
		err := s.Workloads.ExportAssessmentReports(s.DetailExporter)
		if err != nil {

		}
	}

	if option.DumpDetails {
		err := s.Workloads.ExportAssessmentDetails(s.DetailExporter)
		if err != nil {

		}
	}
}

// postAnalyze adds an album from JSON received in the request body.
func (s *Server) postAnalyze(c *gin.Context) {
	var v AnalyzeOption

	// Call BindJSON to bind the received JSON to
	// newAlbum.
	if err := c.BindJSON(&v); err != nil {
		return
	}

	if !s.IsRunning {
		go s.Analyze(v)
		c.IndentedJSON(http.StatusCreated, "start analyzing")
	}

	c.IndentedJSON(http.StatusFailedDependency, "analyze is running")
}

func (s *Server) getStatus(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, Status{
		IsRunning: s.IsRunning,
		Last:      s.Last,
	})
}

func (s *Server) getRisks(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, s.Workloads)
}

// Run turn the server
func (s *Server) Run(address string) {
	s.Images = make(map[string]*ImageItem)
	router := gin.Default()
	router.GET("/status", s.getStatus)
	router.GET("/risks", s.getRisks)
	router.POST("/analyze", s.postAnalyze)
	router.POST("/resource", s.postResource)
	router.Run(address)
}
