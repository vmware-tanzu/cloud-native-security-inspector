package kubebench

import (
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

var (
	detecetedKubeVersion string
	masterFile           = "master.yaml"
	nodeFile             = "node.yaml"
	etcdFile             = "etcd.yaml"
	controlplaneFile     = "controlplane.yaml"
	policiesFile         = "policies.yaml"
	managedservicesFile  = "managedservices.yaml"
	defaultKubeVersion   = "1.18"
	skipIds              string
	controlsCollection   []*check.Controls
)

type FilterOpts struct {
	CheckList string
	GroupList string
	Scored    bool
	Unscored  bool
}

// NewRunFilter constructs a Predicate based on FilterOpts which determines whether tested Checks should be run or not.
func NewRunFilter(opts FilterOpts) (check.Predicate, error) {
	if opts.CheckList != "" && opts.GroupList != "" {
		return nil, fmt.Errorf("group option and check option can't be used together")
	}

	var groupIDs map[string]bool
	if opts.GroupList != "" {
		groupIDs = cleanIDs(opts.GroupList)
	}

	var checkIDs map[string]bool
	if opts.CheckList != "" {
		checkIDs = cleanIDs(opts.CheckList)
	}

	return func(g *check.Group, c *check.Check) bool {
		test := true
		if len(groupIDs) > 0 {
			_, ok := groupIDs[g.ID]
			test = test && ok
		}

		if len(checkIDs) > 0 {
			_, ok := checkIDs[c.ID]
			test = test && ok
		}

		test = test && (opts.Scored && c.Scored || opts.Unscored && !c.Scored)

		return test
	}, nil
}

func runChecks(nodetype check.NodeType, testYamlFile, detectedVersion string) {
	in, err := ioutil.ReadFile(testYamlFile)
	if err != nil {
		exitWithError(fmt.Errorf("error opening %s test file: %v", testYamlFile, err))
	}

	log.Infof("Using test file: %s\n", testYamlFile)

	// Get the viper config for this section of tests
	typeConf := viper.Sub(string(nodetype))
	if typeConf == nil {
		log.Error(check.FAIL, fmt.Sprintf("No config settings for %s\n", string(nodetype)))
		os.Exit(1)
	}

	// Get the set of executables we need for this section of the tests
	binmap, err := getBinaries(typeConf, nodetype)
	// Checks that the executables we need for the section are running.
	if err != nil {
		log.Infof("failed to get a set of executables needed for tests: %v", err)
	}

	confmap := getFiles(typeConf, "config")
	svcmap := getFiles(typeConf, "service")
	kubeconfmap := getFiles(typeConf, "kubeconfig")
	cafilemap := getFiles(typeConf, "ca")

	// Variable substitutions. Replace all occurrences of variables in controls files.
	s := string(in)
	s, binSubs := makeSubstitutions(s, "bin", binmap)
	s, _ = makeSubstitutions(s, "conf", confmap)
	s, _ = makeSubstitutions(s, "svc", svcmap)
	s, _ = makeSubstitutions(s, "kubeconfig", kubeconfmap)
	s, _ = makeSubstitutions(s, "cafile", cafilemap)

	controls, err := check.NewControls(nodetype, []byte(s), detectedVersion)
	if err != nil {
		exitWithError(fmt.Errorf("error setting up %s controls: %v", nodetype, err))
	}

	runner := check.NewRunner()
	filterOpts := FilterOpts{
		CheckList: "",
		GroupList: "",
		Scored:    true,
		Unscored:  true,
	}
	filter, err := NewRunFilter(filterOpts)
	if err != nil {
		exitWithError(fmt.Errorf("error setting up run filter: %v", err))
	}

	generateDefaultEnvAudit(controls, binSubs)

	controls.RunChecks(runner, filter, parseSkipIds(skipIds))
	controlsCollection = append(controlsCollection, controls)
}

func generateDefaultEnvAudit(controls *check.Controls, binSubs []string) {
	for _, group := range controls.Groups {
		for _, checkItem := range group.Checks {
			if checkItem.Tests != nil && !checkItem.DisableEnvTesting {
				for _, test := range checkItem.Tests.TestItems {
					if test.Env != "" && checkItem.AuditEnv == "" {
						binPath := ""

						if len(binSubs) == 1 {
							binPath = binSubs[0]
						} else {
							log.Infof("AuditEnv not explicit for check (%s), where bin path cannot be determined", checkItem.ID)
						}

						if test.Env != "" && checkItem.AuditEnv == "" {
							checkItem.AuditEnv = fmt.Sprintf("cat \"/proc/$(/bin/ps -C %s -o pid= | tr -d ' ')/environ\" | tr '\\0' '\\n'", binPath)
						}
					}
				}
			}
		}
	}
}

func parseSkipIds(skipIds string) map[string]bool {
	skipIdMap := make(map[string]bool, 0)
	if skipIds != "" {
		for _, id := range strings.Split(skipIds, ",") {
			skipIdMap[strings.Trim(id, " ")] = true
		}
	}
	return skipIdMap
}

// loadConfig finds the correct config dir based on the kubernetes version,
// merges any specific config.yaml file found with the main config
// and returns the benchmark file to use.
func loadConfig(nodetype check.NodeType, benchmarkVersion string) string {
	var file string
	var err error

	switch nodetype {
	case check.MASTER:
		file = masterFile
	case check.NODE:
		file = nodeFile
	case check.CONTROLPLANE:
		file = controlplaneFile
	case check.ETCD:
		file = etcdFile
	case check.POLICIES:
		file = policiesFile
	case check.MANAGEDSERVICES:
		file = managedservicesFile
	}

	path, err := getConfigFilePath(benchmarkVersion, file)
	if err != nil {
		exitWithError(fmt.Errorf("can't find %s controls file in %s: %v", nodetype, cfgDir, err))
	}

	// Merge version-specific config if any.
	mergeConfig(path)

	return filepath.Join(path, file)
}

func mergeConfig(path string) error {
	viper.SetConfigFile(path + "/config.yaml")
	err := viper.MergeInConfig()
	if err != nil {
		if os.IsNotExist(err) {
			log.Infof("No version-specific config.yaml file in %s", path)
		} else {
			return fmt.Errorf("couldn't read config file %s: %v", path+"/config.yaml", err)
		}
	}

	log.Infof("Using config file: %s\n", viper.ConfigFileUsed())

	return nil
}

func mapToBenchmarkVersion(kubeToBenchmarkMap map[string]string, kv string) (string, error) {
	kvOriginal := kv
	cisVersion, found := kubeToBenchmarkMap[kv]
	log.Infof("mapToBenchmarkVersion for k8sVersion: %q cisVersion: %q found: %t\n", kv, cisVersion, found)
	for !found && (kv != defaultKubeVersion && !isEmpty(kv)) {
		kv = decrementVersion(kv)
		cisVersion, found = kubeToBenchmarkMap[kv]
		log.Infof("mapToBenchmarkVersion for k8sVersion: %q cisVersion: %q found: %t\n", kv, cisVersion, found)
	}

	if !found {
		log.Infof("mapToBenchmarkVersion unable to find a match for: %q", kvOriginal)
		log.Infof("mapToBenchmarkVersion kubeToBenchmarkMap: %#v", kubeToBenchmarkMap)
		return "", fmt.Errorf("unable to find a matching Benchmark Version match for kubernetes version: %s", kvOriginal)
	}

	return cisVersion, nil
}

func loadVersionMapping(v *viper.Viper) (map[string]string, error) {
	kubeToBenchmarkMap := v.GetStringMapString("version_mapping")
	if kubeToBenchmarkMap == nil || (len(kubeToBenchmarkMap) == 0) {
		return nil, fmt.Errorf("config file is missing 'version_mapping' section")
	}

	return kubeToBenchmarkMap, nil
}

func loadTargetMapping(v *viper.Viper) (map[string][]string, error) {
	benchmarkVersionToTargetsMap := v.GetStringMapStringSlice("target_mapping")
	if len(benchmarkVersionToTargetsMap) == 0 {
		return nil, fmt.Errorf("config file is missing 'target_mapping' section")
	}

	return benchmarkVersionToTargetsMap, nil
}

func getBenchmarkVersion(kubeVersion, benchmarkVersion string, platform Platform, v *viper.Viper) (bv string, err error) {
	detecetedKubeVersion = "none"
	if !isEmpty(kubeVersion) && !isEmpty(benchmarkVersion) {
		return "", fmt.Errorf("it is an error to specify both --version and --benchmark flags")
	}
	if isEmpty(benchmarkVersion) && isEmpty(kubeVersion) && !isEmpty(platform.Name) {
		benchmarkVersion = getPlatformBenchmarkVersion(platform)
		if !isEmpty(benchmarkVersion) {
			detecetedKubeVersion = benchmarkVersion
		}
	}

	if isEmpty(benchmarkVersion) {
		if isEmpty(kubeVersion) {
			kv, err := getKubeVersion()
			if err != nil {
				return "", fmt.Errorf("Version check failed: %s\nAlternatively, you can specify the version with --version", err)
			}
			kubeVersion = kv.BaseVersion()
			detecetedKubeVersion = kubeVersion
		}

		kubeToBenchmarkMap, err := loadVersionMapping(v)
		if err != nil {
			return "", err
		}

		benchmarkVersion, err = mapToBenchmarkVersion(kubeToBenchmarkMap, kubeVersion)
		if err != nil {
			return "", err
		}

		log.Infof("Mapped Kubernetes version: %s to Benchmark version: %s", kubeVersion, benchmarkVersion)
	}

	log.Infof("Kubernetes version: %q to Benchmark version: %q", kubeVersion, benchmarkVersion)
	return benchmarkVersion, nil
}

// isMaster verify if master components are running on the node.
func isMaster() bool {
	return isThisNodeRunning(check.MASTER)
}

// isEtcd verify if etcd components are running on the node.
func isEtcd() bool {
	return isThisNodeRunning(check.ETCD)
}

func isThisNodeRunning(nodeType check.NodeType) bool {
	log.Infof("Checking if the current node is running %s components", nodeType)
	nodeTypeConf := viper.Sub(string(nodeType))
	if nodeTypeConf == nil {
		log.Infof("No config for %s components found", nodeType)
		return false
	}

	components, err := getBinariesFunc(nodeTypeConf, nodeType)
	if err != nil {
		log.Infof("Failed to find %s binaries: %v", nodeType, err)
		return false
	}
	if len(components) == 0 {
		log.Infof("No %s binaries specified", nodeType)
		return false
	}

	log.Infof("Node is running %s components", nodeType)
	return true
}

// validTargets helps determine if the targets
// are legitimate for the benchmarkVersion.
func validTargets(benchmarkVersion string, targets []string, v *viper.Viper) (bool, error) {
	benchmarkVersionToTargetsMap, err := loadTargetMapping(v)
	if err != nil {
		return false, err
	}
	providedTargets, found := benchmarkVersionToTargetsMap[benchmarkVersion]
	if !found {
		return false, fmt.Errorf("no targets configured for %s", benchmarkVersion)
	}

	for _, pt := range targets {
		f := false
		for _, t := range providedTargets {
			if pt == strings.ToLower(t) {
				f = true
				break
			}
		}

		if !f {
			return false, nil
		}
	}

	return true, nil
}
