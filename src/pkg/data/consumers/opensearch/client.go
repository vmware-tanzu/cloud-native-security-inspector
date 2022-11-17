package consumers

import (
	"crypto/tls"
	"github.com/opensearch-project/opensearch-go"
	"net/http"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sync"
)

var (
	lock   = &sync.Mutex{}
	client *opensearch.Client
)

func NewClient(cert []byte, addr string, username string, passwd string) *opensearch.Client {
	lock.Lock()
	defer lock.Unlock()
	if client == nil {
		var err error
		client, err = opensearch.NewClient(opensearch.Config{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
			Addresses: []string{addr},
			Username:  username, // For testing only. Don't store credentials in code.
			Password:  passwd,
		})
		if err != nil {
			log.Log.Info("Opensearch client is nil", nil, nil)
			panic(err)
		}
	}
	return client
}
