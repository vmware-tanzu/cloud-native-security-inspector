package consumers

import (
	"encoding/json"
	"fmt"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/pkg/errors"
	"sigs.k8s.io/controller-runtime/pkg/log"
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
	log.Log.Info("ElasticSearch config: ", "addr", addr)
	log.Log.Info("ElasticSearch config: ", "clientArgs.username", username)
	log.Log.Info("ElasticSearch config: ", "passwd", passwd)
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
			log.Log.Info("ElasticSearch client is nil")
			ctrlLog.V(0).Error(err, "Error creating the Client of ElasticSearch")
		}
	}
	return client

}

func TestClient() error {
	var r map[string]interface{}
	res, err := client.Info()
	if err != nil {
		log.Log.Error(err, "Error getting response")
		return err
	}
	defer res.Body.Close()
	// Check response status
	if res.IsError() {
		log.Log.Error(errors.New("ElasticSearch test client error"), "TestClient error")
		return err
	}
	// Deserialize the response into a map.
	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
		log.Log.Error(errors.New("ElasticSearch json decode error"), "TestClient error")
		return err
	}
	// Print client and server version numbers.
	log.Log.Info(fmt.Sprintf("Client: %s", elasticsearch.Version))
	log.Log.Info(fmt.Sprintf("Server: %s", r["version"].(map[string]interface{})["number"]))
	log.Log.Info(fmt.Sprintf(strings.Repeat("~", 37)))
	return nil
}
