package main

import (
	"context"
	"flag"
	"github.com/fsnotify/fsnotify"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/api/v1alpha1"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/pkg/inspection/kubebench"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"os"
	"os/exec"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
	"time"
)

var (
	scheme  = runtime.NewScheme()
	rootCtx = context.Background()
)

const (
	varLibEtcdPath                  = "/var/lib/etcd"
	varLibKubeletPath               = "/var/lib/kubelet"
	varLibKubeSchedulerPath         = "/var/lib/kube-scheduler"
	varLibKubeControllerManagerPath = "/var/lib/kube-controller-manager"
	etcSystemdPath                  = "/etc/systemd"
	libSystemdPath                  = "/lib/systemd/"
	srvKubernetesPath               = "/srv/kubernetes/"
	etcKubernetesPath               = "/etc/kubernetes"
	usrBinPath                      = "/usr/local/mount-from-host/bin"
	etcCniNetdPath                  = "/etc/cni/net.d/"
	optCniBinPath                   = "/opt/cni/bin/"
)

func init() {
	utilruntime.Must(clientgoscheme.AddToScheme(scheme))
	utilruntime.Must(v1alpha1.AddToScheme(scheme))
}

//+kubebuilder:rbac:groups="",resources=pods,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=apps,resources=replicasets,verbs=get;list;watch;create;update;patch;delete

func scan() {
	var policy string
	flag.StringVar(&policy, "policy", "", "name of the inspection policy")
	flag.Parse()
	log.Infof("policy name %s", policy)
	log.Info("kube-bench scanning...")

	k8sClient, err := client.New(ctrl.GetConfigOrDie(), client.Options{
		Scheme: scheme,
	})
	if err != nil {
		log.Error(err, "unable to create k8s client")
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(rootCtx)
	defer cancel()

	// Get the policy CR details.
	inspectionPolicy := &v1alpha1.InspectionPolicy{}
	if err := k8sClient.Get(ctx, client.ObjectKey{Name: policy}, inspectionPolicy); err != nil {
		log.Error(err, "unable to retrieve the specified inspection policy")
		os.Exit(1)
	}
	hostname := getHostName()
	log.Infof("Kubebench scanner running on host:%v", hostname)

	runner := kubebench.NewController().
		WithScheme(scheme).
		WithK8sClient(k8sClient).
		WithHostname(hostname).
		CTRL()

	if err := runner.Run(ctx, inspectionPolicy); err != nil {
		log.Error(err, "kubebench controller run")
		os.Exit(1)
	}
}

func getHostName() string {
	out, err := exec.Command("hostname").Output()
	if err != nil {
		log.Error("failed to get the hostname in the daemon pod")
		return ""
	}
	output := string(out[:])
	output = strings.Trim(output, "\n")
	return output
}

func main() {
	// Create new watcher.
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	defer watcher.Close()
	lastScanTime := time.Now()
	// Do one round of scanning before listening on the events
	scan()
	const coolDownSeconds = 60
	// Start listening for events.
	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					log.Errorf("missed one event %s", event)
					continue
				}
				if event.Has(fsnotify.Write) {
					log.Infof("modified file: %s", event.Name)
					now := time.Now()
					diff := now.Sub(lastScanTime)
					if diff.Seconds() > coolDownSeconds {
						lastScanTime = now
						log.Infof("past %d seconds since the last scan, will trigger a new one", coolDownSeconds)
						scan()
					} else {
						log.Debug("detected frequently change of the file, throttle the scan")
					}
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					log.Fatal("watcher reports an error: ", err)
					os.Exit(1)
				}
			}
		}
	}()

	// Add the paths
	pathList := []string{
		varLibEtcdPath,
		varLibKubeletPath,
		varLibKubeSchedulerPath,
		varLibKubeControllerManagerPath,
		etcSystemdPath,
		libSystemdPath,
		srvKubernetesPath,
		etcKubernetesPath,
		usrBinPath,
		etcCniNetdPath,
		optCniBinPath,
	}
	log.Info("the watcher has been started to watch the K8s configurations files")
	for _, path := range pathList {
		err = watcher.Add(path)
		log.Infof("watching path: %s", path)
		if err != nil {
			log.Fatalf("failed to add the path %s path, err: %s", path, err)
		}
	}
	// Block main goroutine forever.
	<-make(chan struct{})
}
