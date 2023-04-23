package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	log "github.com/sirupsen/logrus"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/etc"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/ext"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/http/api"
	v1 "github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/http/api/v1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/persistence/redis"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/queue"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/redisx"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/scan"
	"github.com/vmware-tanzu/cloud-native-security-inspector/cnsi-scanner-trivy/pkg/trivy"
)

var (
	// Default wise GoReleaser sets three ldflags:
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	log.SetOutput(os.Stdout)
	log.SetLevel(etc.GetLogLevel())
	log.SetReportCaller(false)
	log.SetFormatter(&log.JSONFormatter{})

	info := etc.BuildInfo{
		Version: version,
		Commit:  commit,
		Date:    date,
	}

	if err := run(info); err != nil {
		log.Fatalf("Error: %v", err)
	}
}

func run(info etc.BuildInfo) error {
	log.WithFields(log.Fields{
		"version":  info.Version,
		"commit":   info.Commit,
		"built_at": info.Date,
	}).Info("Starting harbor-scanner-trivy")

	config, err := etc.GetConfig()
	if err != nil {
		return fmt.Errorf("getting config: %w", err)
	}
	if err = etc.Check(config); err != nil {
		return fmt.Errorf("checking config: %w", err)
	}

	pool, err := redisx.NewPool(config.RedisPool)
	if err != nil {
		return fmt.Errorf("constructing connection pool: %w", err)
	}

	wrapper := trivy.NewWrapper(config.Trivy, ext.DefaultAmbassador)
	store := redis.NewStore(config.RedisStore, pool)
	controller := scan.NewController(store, wrapper, scan.NewTransformer(&scan.SystemClock{}))
	enqueuer := queue.NewEnqueuer(config.JobQueue, pool, store)
	worker := queue.NewWorker(config.JobQueue, pool, controller)

	apiHandler := v1.NewAPIHandler(info, config, enqueuer, store, wrapper)
	apiServer, err := api.NewServer(config.API, apiHandler)
	if err != nil {
		return fmt.Errorf("new api server: %w", err)
	}

	shutdownComplete := make(chan struct{})
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, syscall.SIGINT, syscall.SIGTERM)
		captured := <-sigint
		log.WithField("signal", captured.String()).Debug("Trapped os signal")

		apiServer.Shutdown()
		worker.Stop()

		close(shutdownComplete)
	}()

	worker.Start()
	apiServer.ListenAndServe()

	<-shutdownComplete
	return nil
}
