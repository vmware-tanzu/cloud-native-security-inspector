package riskmanager

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/go-logr/logr"
	"github.com/goharbor/harbor/src/jobservice/logger"
	"log"
	"net/http"
)

// Client client to post requests
type Client struct {
	conf   *Config
	logger logr.Logger
}

// NewClient new client
func NewClient(conf *Config, logger logr.Logger) *Client {
	if conf == nil {
		conf = DefaultConfig()
	}
	return &Client{conf: conf, logger: logger}
}

// IsAnalyzeRunning get analyze status
func (c *Client) IsAnalyzeRunning() (bool, error) {
	requestURL := fmt.Sprintf(fmt.Sprintf("%s/status", c.conf.Server))
	log.Default().Printf("get to: %s", requestURL)
	res, err := http.Get(requestURL)
	if err != nil {
		return false, err
	}

	defer res.Body.Close()
	var target Status

	err = json.NewDecoder(res.Body).Decode(&target)
	if err != nil {
		return false, err
	}

	log.Default().Printf("analyze running: %v", target.IsRunning)

	return target.IsRunning, nil
}

// PostAnalyze ask server to analyze resources
func (c *Client) PostAnalyze(a AnalyzeOption) error {
	requestURL := fmt.Sprintf(fmt.Sprintf("%s/analyze", c.conf.Server))
	log.Default().Printf("post to: %s", requestURL)

	if jsonData, err := json.Marshal(a); err == nil {
		request, error := http.NewRequest("POST", requestURL, bytes.NewBuffer(jsonData))
		request.Header.Set("Content-Type", "application/json; charset=UTF-8")

		client := &http.Client{}
		response, error := client.Do(request)
		if error != nil || response.StatusCode != http.StatusCreated {
			return err
		}

		response.Body.Close()
	}

	return nil
}

func (c *Client) PostResource(a interface{}) error {
	requestURL := fmt.Sprintf(fmt.Sprintf("%s/resource", c.conf.Server))
	log.Default().Printf("post to: %s", requestURL)

	if jsonData, err := json.Marshal(a); err == nil {
		request, _ := http.NewRequest("POST", requestURL, bytes.NewBuffer(jsonData))
		request.Header.Set("Content-Type", "application/json; charset=UTF-8")

		client := &http.Client{}
		response, err := client.Do(request)
		if err != nil || response.StatusCode != http.StatusCreated {
			return err
		}

		response.Body.Close()
	} else {
		logger.Infof("json marshal err: %v", err)
	}

	return nil
}

// SendExitInstruction send exit instruction
func (c *Client) SendExitInstruction() error {
	requestURL := fmt.Sprintf(fmt.Sprintf("%s/exit", c.conf.Server))
	log.Default().Printf("get to: %s", requestURL)
	res, err := http.Get(requestURL)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	return nil
}
