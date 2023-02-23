package main

import (
	"fmt"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"net/http"
)

func main() {
	http.HandleFunc("/forward", mainHandler)
	listenPort := 6780
	log.Infof("data exporter is up and listening on port %d", listenPort)

	if err := http.ListenAndServe(fmt.Sprintf("%s:%d", "", listenPort), nil); err != nil {
		log.Fatalf("failed to start the data exporter server")
	}
}
