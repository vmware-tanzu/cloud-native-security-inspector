package consumers

import (
	"crypto/tls"
	"github.com/opensearch-project/opensearch-go"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"net/http"
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
			log.Info("Opensearch client is nil")
			panic(err)
		}
	}
	return client
}
