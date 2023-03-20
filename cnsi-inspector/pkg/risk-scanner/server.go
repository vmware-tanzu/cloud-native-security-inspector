package risk_scanner

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-exporter/pkg/inputs"
	riskdata "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/risk-scanner/data"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-inspector/pkg/risk-scanner/types"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-manager/pkg/data/providers"
	"github.com/vmware-tanzu/cloud-native-security-inspector/lib/log"
	"net/http"
	"os"
	"strings"
	"time"
)

// Status risk evaluation status
type Status struct {
	IsRunning bool  `json:"is_running"`
	Last      int64 `json:"last"`
}

// AnalyzeOption analyze option
type AnalyzeOption struct {
	//DumpAssessReport bool
	SkipImages []string
}

// Server the server
type Server struct {
	Workloads riskdata.Workloads
	Evaluator riskdata.Evaluator
	IsRunning bool
	Images    map[string]*riskdata.ImageItem
	Last      int64
	adapter   providers.Adapter
	policy    *v1alpha1.InspectionPolicy
	ctx       context.Context
}

// NewServer new server instance
func NewServer() *Server {
	return &Server{
		Images:    make(map[string]*riskdata.ImageItem),
		Workloads: *riskdata.NewWorkloads(make(map[string][]*riskdata.RiskItem), make(map[string]*riskdata.ResourceItem)),
		Evaluator: riskdata.NewDefaultEvaluator(),
	}
}

// WithAdapter sets adapter.
func (s *Server) WithAdapter(Adapter providers.Adapter) *Server {
	s.adapter = Adapter
	return s
}

// WithPolicy sets the policy
func (s *Server) WithPolicy(policy *v1alpha1.InspectionPolicy) *Server {
	s.policy = policy
	return s
}

func (s *Server) WithContext(ctx context.Context) *Server {
	s.ctx = ctx
	return s
}

// postResource adds an album from JSON received in the request body.
func (s *Server) postResource(c *gin.Context) {
	log.Info("come in postResource request")
	var v riskdata.ResourceItem

	// Call BindJSON to bind the received JSON to
	// newAlbum.
	if err := c.BindJSON(&v); err != nil {
		log.Infof("bind json err: %v \n", err)
		c.IndentedJSON(http.StatusBadRequest, err)
		return
	}

	images := v.GetImages(s.ctx, s.adapter, s.policy.Spec.Inspection.Baselines)
	for _, i := range images {
		if _, ok := s.Images[i.UUID()]; !ok {
			s.Images[i.UUID()] = riskdata.NewImageItem(i.ImageName, i.ArtifactID)
		}

		s.Images[i.UUID()].AddRelatedResource(&v)
	}

	s.Workloads.AddResource(&v)

	c.IndentedJSON(http.StatusCreated, v)
}

func (s *Server) Clear() {
	s.Images = make(map[string]*riskdata.ImageItem)
	s.Workloads.Risks = make(map[string][]*riskdata.RiskItem)
	s.Workloads.Items = make(map[string]*riskdata.ResourceItem)
}

func (s *Server) Analyze(option AnalyzeOption) {
	log.Info("come in Analyze request")
	s.IsRunning = true
	defer func() {
		s.IsRunning = false
		s.Clear()
	}()

	for _, t := range s.Images {
		report, err := t.FetchHarborReport(s.adapter)
		if err != nil {
			log.Errorf("get vuln reprot error: %v", err)
			continue
		} else {
			if report.Vulnerabilities == nil {
				log.Error("report is empty")
				continue
			}
			log.Infof("vuln len: %d", len(report.Vulnerabilities))
		}

		for _, r := range t.Related {
			s.Evaluator.Eval(r, &s.Workloads, report)
		}
	}
	// export the data
	err := s.exportRiskReport(s.Workloads.Risks)
	if err != nil {
		log.Error(err, "failed to export the risk report to exporter")
	}
}

// constructRiskExportStruct takes a RiskReport type and convert it to a struct which is ready to be sent
// to the exporter
func (s *Server) constructRiskExportStruct(riskReport *types.RiskReport) *v1alpha1.ReportData {
	bytes, err := json.Marshal(riskReport)
	if err != nil {
		log.Error(err, "failed to marshal the risk report")
		return nil
	}
	reportData := &v1alpha1.ReportData{
		Source:       "risk_report",
		ExportConfig: s.policy.Spec.Inspector.ExportConfig,
		Payload:      string(bytes),
	}
	return reportData
}

// exportRiskReport takes a RiskCollection type and will send to the exporter directly
func (s *Server) exportRiskReport(risks riskdata.RiskCollection) error {
	var details []types.RiskDetail
	currentTimeData := time.Now().Format(time.RFC3339)
	for s, items := range risks {
		split := strings.Split(s, ":")
		if len(split) != 4 {
			log.Error("key non-standard:" + s)
			continue
		}
		kind := split[0]
		name := split[1]
		namespace := split[2]
		uid := split[3]

		var riskDetail types.RiskDetail
		riskDetail.Kind = kind
		riskDetail.Name = name
		riskDetail.Namespace = namespace
		riskDetail.Uid = uid
		riskDetail.Detail = items
		riskDetail.CreateTimestamp = currentTimeData
		details = append(details, riskDetail)
	}
	riskReport := &types.RiskReport{
		ReportDetail:    details,
		CreateTimestamp: currentTimeData,
		DocID:           "risk-report-" + currentTimeData,
	}
	reportToBeSent := s.constructRiskExportStruct(riskReport)
	if reportToBeSent != nil {
		err := inputs.PostReport(reportToBeSent)
		return err
	}
	return errors.New("report are generated but not sent")
}

// postAnalyze adds an album from JSON received in the request body.
func (s *Server) postAnalyze(c *gin.Context) {
	log.Info("come in postAnalyze request")
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
	log.Info("receive exit instruction, start exit")
	c.IndentedJSON(http.StatusOK, "ok")
	defer func() {
		time.Sleep(3 * time.Second)
		os.Exit(0)
	}()
}

// Run turn the server
func (s *Server) Run(address string) {
	s.Images = make(map[string]*riskdata.ImageItem)
	router := gin.Default()
	router.GET("/status", s.getStatus)
	router.GET("/risks", s.getRisks)
	router.GET("/exit", s.getExit)
	router.POST("/analyze", s.postAnalyze)
	router.POST("/resource", s.postResource)
	log.Info("Server run at:")
	log.Infof("-  Local:   %s/ \r\n", address)
	err := router.Run(address)
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe err: %v", err))
	}
}
