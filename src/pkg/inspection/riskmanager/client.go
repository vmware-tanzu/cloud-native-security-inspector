package riskmanager

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/go-logr/logr"
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

	return target.IsRunning, nil
}

// PostAnalyze ask server to analyze resources
func (c *Client) PostAnalyze(a AnalyzeOption) error {
	requestURL := fmt.Sprintf(fmt.Sprintf("%s/analyze", c.conf.Server))
	log.Default().Printf("post to: %s \n", requestURL)

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
	log.Default().Printf("post to: %s \n", requestURL)

	if jsonData, err := json.Marshal(a); err == nil {
		request, _ := http.NewRequest("POST", requestURL, bytes.NewBuffer(jsonData))
		request.Header.Set("Content-Type", "application/json; charset=UTF-8")

		client := &http.Client{}
		response, err := client.Do(request)
		if err != nil || response.StatusCode != http.StatusCreated {
			return err
		}

		response.Body.Close()

		log.Default().Printf("http request send success")
	} else {
		log.Default().Printf("json marshal err: %v", err)
	}

	return nil
}
