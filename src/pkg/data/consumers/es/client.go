package es

import (
	"encoding/json"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/goharbor/harbor/src/jobservice/logger"
	"log"
	"strings"
	"sync"
)

var (
	lock   = &sync.Mutex{}
	client *elasticsearch.Client
)

func NewClient(cert []byte, addr string, username string, passwd string) *elasticsearch.Client {
	lock.Lock()
	defer lock.Unlock()
	logger.Info("ES config: ", "addr", addr)
	logger.Info("ES config: ", "clientArgs.username", username)
	logger.Info("ES config: ", "passwd", passwd)
	if client == nil {
		cfg := elasticsearch.Config{
			Addresses: []string{
				addr,
			},
			Username: username,
			Password: passwd,
			CACert:   cert,
		}
		var err error
		client, err = elasticsearch.NewClient(cfg)
		if err != nil {
			logger.Info("ES client is nil", nil, nil)
			ctrlLog.V(0).Error(err, "Error creating the Client of ElasticSearch")
		}
	}
	return client

}

func TestClient() error {
	var r map[string]interface{}
	logger.Info("ES Test Client", nil, client.BaseClient.Transport)
	res, err := client.Info()
	if err != nil {
		logger.Info("", err)
		log.Fatalf("Error getting response: %s", err)
		return err
	}
	defer res.Body.Close()
	// Check response status
	if res.IsError() {
		log.Fatalf("Error: %s", res.String())
		return err
	}
	// Deserialize the response into a map.
	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
		log.Fatalf("Error parsing the response body: %s", err)
		return err
	}
	// Print client and server version numbers.
	log.Printf("Client: %s", elasticsearch.Version)
	log.Printf("Server: %s", r["version"].(map[string]interface{})["number"])
	log.Println(strings.Repeat("~", 37))
	return nil
}
