package es

import (
	"github.com/elastic/go-elasticsearch/v8"
	"log"
	"sync"
)

var (
	lock   = &sync.Mutex{}
	client *elasticsearch.Client
)

func NewClient(cert []byte, addr string, username string, passwd string) *elasticsearch.Client {
	lock.Lock()
	defer lock.Unlock()
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
			log.Fatalf("Error creating the Client: %s", err)
		}
	}
	return client

}
