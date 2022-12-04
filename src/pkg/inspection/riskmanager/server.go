package riskmanager

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/goharbor/harbor/src/jobservice/logger"
	es "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/es"
	consumers "github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/consumers/opensearch"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/data/providers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspection/data"
	"net/http"
	"os"
	"time"
)

// Status risk evaluation status
type Status struct {
	IsRunning bool  `json:"is_running"`
	Last      int64 `json:"last"`
}

// AnalyzeOption analyze option
type AnalyzeOption struct {
	OpenSearchEnabled    bool
	ElasticSearchEnabled bool
	//DumpAssessReport bool
	SkipImages []string
}

// Server the server
type Server struct {
	Workloads          data.Workloads
	Evaluator          data.Evaluator
	IsRunning          bool
	Images             map[string]*data.ImageItem
	Last               int64
	osExporter         *consumers.OpenSearchExporter
	AssessmentExporter *consumers.OpenSearchExporter
	esExporter         *es.ElasticSearchExporter
	adapter            providers.Adapter
}

// NewServer new server instance
func NewServer(detailExporter *consumers.OpenSearchExporter,
	esExporter *es.ElasticSearchExporter) *Server {

	return &Server{
		osExporter: detailExporter,
		esExporter: esExporter,
		Images:     make(map[string]*data.ImageItem),
		Workloads:  *data.NewWorkloads(make(map[string][]*data.RiskItem), make(map[string]*data.ResourceItem)),
		Evaluator:  data.NewDefaultEvaluator(),
	}
}

// WithAdapter sets adapter.
func (s *Server) WithAdapter(Adapter providers.Adapter) *Server {
	s.adapter = Adapter
	return s
}

// postAlbums adds an album from JSON received in the request body.
func (s *Server) postResource(c *gin.Context) {
	fmt.Println("come in postResource request")
	var v data.ResourceItem

	// Call BindJSON to bind the received JSON to
	// newAlbum.
	if err := c.BindJSON(&v); err != nil {
		fmt.Printf("bind json err: %v \n", err)
		c.IndentedJSON(http.StatusBadRequest, err)
		return
	}

	//fmt.Printf("receive resource type: %s \n", v.Type)

	images := v.GetImages()
	for _, i := range images {
		if _, ok := s.Images[i.UUID()]; !ok {
			s.Images[i.UUID()] = data.NewImageItem(i.ImageName, i.ArtifactID)
		}

		s.Images[i.UUID()].AddRelatedResource(&v)
	}

	s.Workloads.AddResource(&v)

	c.IndentedJSON(http.StatusCreated, v)
}

func (s *Server) Clear() {
	s.Images = make(map[string]*data.ImageItem)
	s.Workloads.Risks = make(map[string][]*data.RiskItem)
	s.Workloads.Items = make(map[string]*data.ResourceItem)
}

func (s *Server) Analyze(option AnalyzeOption) {
	fmt.Println("come in Analyze request")
	s.IsRunning = true
	defer func() {
		s.IsRunning = false
		s.Clear()
	}()

	//var v data.RiskCollection = make(map[string][]*data.RiskItem)
	for _, t := range s.Images {
		report, err := t.FetchHarborReport(s.adapter)
		if err != nil {
			logger.Errorf("get vuln reprot error: %v", err)
			continue
		} else {
			fmt.Printf("vuln len: %d \n", len(report.Vulnerabilities))
		}

		for _, r := range t.Related {
			s.Evaluator.Eval(r, &s.Workloads, report)
		}
	}

	if option.OpenSearchEnabled {
		//if s.Workloads.Risks == nil || len(s.Workloads.Risks) == 0 {
		//	fmt.Println("not vuln save to openSearch")
		//	return
		//}
		err := s.osExporter.SaveRiskReport(s.Workloads.Risks)
		if err != nil {
			logger.Errorf("os SaveRiskReport error: %v", err)
		}
	}

	if option.ElasticSearchEnabled {
		//if s.Workloads.Risks == nil || len(s.Workloads.Risks) == 0 {
		//	fmt.Println("not vuln save to ElasticSearch")
		//	return
		//}
		err := s.esExporter.SaveRiskReport(s.Workloads.Risks)
		if err != nil {
			logger.Errorf("es SaveRiskReport error: %v", err)
		}
	}
}

// postAnalyze adds an album from JSON received in the request body.
func (s *Server) postAnalyze(c *gin.Context) {
	fmt.Println("come in postAnalyze request")
	var v AnalyzeOption

	// Call BindJSON to bind the received JSON to
	// newAlbum.
	if err := c.BindJSON(&v); err != nil {
		return
	}

	if !s.IsRunning {
		go s.Analyze(v)
		c.IndentedJSON(http.StatusCreated, "start analyzing")
		return
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

func (s *Server) getExit(c *gin.Context) {
	fmt.Println("receive exit instruction, start exit")
	c.IndentedJSON(http.StatusOK, "ok")
	defer func() {
		time.Sleep(3 * time.Second)
		os.Exit(0)
	}()
}

// Run turn the server
func (s *Server) Run(address string) {
	s.Images = make(map[string]*data.ImageItem)
	router := gin.Default()
	router.GET("/status", s.getStatus)
	router.GET("/risks", s.getRisks)
	router.GET("/exit", s.getExit)
	router.POST("/analyze", s.postAnalyze)
	router.POST("/resource", s.postResource)
	fmt.Println("Server run at:")
	fmt.Printf("-  Local:   %s/ \r\n", address)
	err := router.Run(address)
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe err: %v", err))
	}
}
