package consumers

import (
	"encoding/json"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/pkg/errors"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
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
	log.Info("ElasticSearch config: ", "addr", addr)
	log.Info("ElasticSearch config: ", "clientArgs.username", username)
	log.Info("ElasticSearch config: ", "passwd", passwd)
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
			log.Info("ElasticSearch client is nil")
			log.Error(err, "Error creating the Client of ElasticSearch")
		}
	}
	return client

}

func TestClient() error {
	var r map[string]interface{}
	res, err := client.Info()
	if err != nil {
		log.Error(err, "Error getting response")
		return err
	}
	defer res.Body.Close()
	// Check response status
	if res.IsError() {
		log.Error(errors.New("ElasticSearch test client error"), "TestClient error")
		return err
	}
	// Deserialize the response into a map.
	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
		log.Error(errors.New("ElasticSearch json decode error"), "TestClient error")
		return err
	}
	// Print client and server version numbers.
	log.Infof("Client: %s", elasticsearch.Version)
	log.Infof("Server: %s", r["version"].(map[string]interface{})["number"])
	log.Info(strings.Repeat("~", 37))
	return nil
}
