package kubebench

import (
	"encoding/json"
	"fmt"
	"github.com/aquasecurity/kube-bench/check"
	"github.com/spf13/viper"
	"github.com/vmware-tanzu/cloud-native-security-inspector/src/lib/log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

var (
	psFunc          func(string) string
	statFunc        func(string) (os.FileInfo, error)
	getBinariesFunc func(*viper.Viper, check.NodeType) (map[string]string, error)
	TypeMap         = map[string][]string{
		"ca":         {"cafile", "defaultcafile"},
		"kubeconfig": {"kubeconfig", "defaultkubeconfig"},
		"service":    {"svc", "defaultsvc"},
		"config":     {"confs", "defaultconf"},
	}
)

func init() {
	psFunc = ps
	statFunc = os.Stat
	getBinariesFunc = getBinaries
}

type Platform struct {
	Name    string
	Version string
}

func (p Platform) String() string {
	return fmt.Sprintf("Platform{ Name: %s Version: %s }", p.Name, p.Version)
}

func exitWithError(err error) {
	fmt.Fprintf(os.Stderr, "\n%v\n", err)
	// flush before exit non-zero
	os.Exit(1)
}

func cleanIDs(list string) map[string]bool {
	list = strings.Trim(list, ",")
	ids := strings.Split(list, ",")

	set := make(map[string]bool)

	for _, id := range ids {
		id = strings.Trim(id, " ")
		set[id] = true
	}

	return set
}

// ps execs out to the ps command; it's separated into a function so we can write tests
func ps(proc string) string {
	// TODO: truncate proc to 15 chars
	// See https://github.com/aquasecurity/kube-bench/issues/328#issuecomment-506813344
	log.Infof("ps - proc: %q", proc)
	cmd := exec.Command("/bin/ps", "-C", proc, "-o", "cmd", "--no-headers")
	out, err := cmd.Output()
	if err != nil {
		log.Info(fmt.Errorf("%s: %s", cmd.Args, err))
	}

	log.Infof("ps - returning: %q", string(out))
	return string(out)
}

// getBinaries finds which of the set of candidate executables are running.
// It returns an error if one mandatory executable is not running.
func getBinaries(v *viper.Viper, nodetype check.NodeType) (map[string]string, error) {
	binmap := make(map[string]string)

	for _, component := range v.GetStringSlice("components") {
		s := v.Sub(component)
		if s == nil {
			continue
		}

		optional := s.GetBool("optional")
		bins := s.GetStringSlice("bins")
		if len(bins) > 0 {
			bin, err := findExecutable(bins)
			if err != nil && !optional {
				log.Info(buildComponentMissingErrorMessage(nodetype, component, bins))
				return nil, fmt.Errorf("unable to detect running programs for component %q", component)
			}

			// Default the executable name that we'll substitute to the name of the component
			if bin == "" {
				bin = component
				log.Infof("Component %s not running", component)
			} else {
				log.Infof("Component %s uses running binary %s", component, bin)
			}
			binmap[component] = bin
		}
	}

	return binmap, nil
}

// getConfigFilePath locates the config files we should be using for CIS version
func getConfigFilePath(benchmarkVersion string, filename string) (path string, err error) {
	log.Infof("Looking for config specific CIS version %q", benchmarkVersion)

	path = filepath.Join(cfgDir, benchmarkVersion)
	file := filepath.Join(path, filename)
	log.Infof("Looking for file: %s", file)

	if _, err := os.Stat(file); err != nil {
		log.Infof("error accessing config file: %q error: %v\n", file, err)
		return "", fmt.Errorf("no test files found <= benchmark version: %s", benchmarkVersion)
	}

	return path, nil
}

// getYamlFilesFromDir returns a list of yaml files in the specified directory, ignoring config.yaml
func getYamlFilesFromDir(path string) (names []string, err error) {
	err = filepath.Walk(path, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		_, name := filepath.Split(path)
		if name != "" && name != "config.yaml" && filepath.Ext(name) == ".yaml" {
			names = append(names, path)
		}

		return nil
	})
	return names, err
}

// decrementVersion decrements the version number
// We want to decrement individually even through versions where we don't supply test files
// just in case someone wants to specify their own test files for that version
func decrementVersion(version string) string {
	split := strings.Split(version, ".")
	if len(split) < 2 {
		return ""
	}
	minor, err := strconv.Atoi(split[1])
	if err != nil {
		return ""
	}
	if minor <= 1 {
		return ""
	}
	split[1] = strconv.Itoa(minor - 1)
	return strings.Join(split, ".")
}

// getFiles finds which of the set of candidate files exist
func getFiles(v *viper.Viper, fileType string) map[string]string {
	filemap := make(map[string]string)
	mainOpt := TypeMap[fileType][0]
	defaultOpt := TypeMap[fileType][1]

	for _, component := range v.GetStringSlice("components") {
		s := v.Sub(component)
		if s == nil {
			continue
		}

		// See if any of the candidate files exist
		file := findConfigFile(s.GetStringSlice(mainOpt))
		if file == "" {
			if s.IsSet(defaultOpt) {
				file = s.GetString(defaultOpt)
				log.Infof("Using default %s file name '%s' for component %s", fileType, file, component)
			} else {
				// Default the file name that we'll substitute to the name of the component
				log.Infof("Missing %s file for %s", fileType, component)
				file = component
			}
		} else {
			log.Infof("Component %s uses %s file '%s'", component, fileType, file)
		}

		filemap[component] = file
	}

	return filemap
}

// verifyBin checks that the binary specified is running
func verifyBin(bin string) bool {
	// Strip any quotes
	bin = strings.Trim(bin, "'\"")

	// bin could consist of more than one word
	// We'll search for running processes with the first word, and then check the whole
	// proc as supplied is included in the results
	proc := strings.Fields(bin)[0]
	out := psFunc(proc)

	// There could be multiple lines in the ps output
	// The binary needs to be the first word in the ps output, except that it could be preceded by a path
	// e.g. /usr/bin/kubelet is a match for kubelet
	// but apiserver is not a match for kube-apiserver
	reFirstWord := regexp.MustCompile(`^(\S*\/)*` + bin)
	lines := strings.Split(out, "\n")
	for _, l := range lines {
		log.Infof("reFirstWord.Match(%s)", l)
		if reFirstWord.Match([]byte(l)) {
			return true
		}
	}

	return false
}

// fundConfigFile looks through a list of possible config files and finds the first one that exists
func findConfigFile(candidates []string) string {
	for _, c := range candidates {
		_, err := statFunc(c)
		if err == nil {
			return c
		}
		if !os.IsNotExist(err) {
			log.Infof("error looking for file %s: %v", c, err)
			return ""
		}
	}

	return ""
}

// findExecutable looks through a list of possible executable names and finds the first one that's running
func findExecutable(candidates []string) (string, error) {
	for _, c := range candidates {
		if verifyBin(c) {
			return c, nil
		}
		log.Infof("executable '%s' not running", c)
	}

	return "", fmt.Errorf("no candidates running")
}

func multiWordReplace(s string, subname string, sub string) string {
	f := strings.Fields(sub)
	if len(f) > 1 {
		sub = "'" + sub + "'"
	}

	return strings.Replace(s, subname, sub, -1)
}

const missingKubectlKubeletMessage = `
Unable to find the programs kubectl or kubelet in the PATH.
These programs are used to determine which version of Kubernetes is running.
Make sure the /usr/local/mount-from-host/bin directory is mapped to the container,
either in the job.yaml file, or Docker command.

For job.yaml:
...
- name: usr-bin
  mountPath: /usr/local/mount-from-host/bin
...

For docker command:
   docker -v $(which kubectl):/usr/local/mount-from-host/bin/kubectl ....

Alternatively, you can specify the version with --version
   kube-bench --version <VERSION> ...
`

func getKubeVersion() (*KubeVersion, error) {
	if k8sVer, err := getKubeVersionFromRESTAPI(); err == nil {
		log.Infof("Kubernetes REST API Reported version: %s", k8sVer)
		return k8sVer, nil
	}

	// These executables might not be on the user's path.
	_, err := exec.LookPath("kubectl")
	if err != nil {
		log.Infof("Error locating kubectl: %s", err)
		_, err = exec.LookPath("kubelet")
		if err != nil {
			log.Infof("Error locating kubelet: %s", err)
			// Search for the kubelet binary all over the filesystem and run the first match to get the kubernetes version
			cmd := exec.Command("/bin/sh", "-c", "`find / -type f -executable -name kubelet 2>/dev/null | grep -m1 .` --version")
			out, err := cmd.CombinedOutput()
			if err == nil {
				log.Infof("Found kubelet and query kubernetes version is: %s", string(out))
				return getVersionFromKubeletOutput(string(out)), nil
			}

			log.Warning(missingKubectlKubeletMessage)
			log.Info("unable to find the programs kubectl or kubelet in the PATH")
			log.Infof("Cant detect version, assuming default %s", defaultKubeVersion)
			return &KubeVersion{baseVersion: defaultKubeVersion}, nil
		}
		return getKubeVersionFromKubelet(), nil
	}

	return getKubeVersionFromKubectl(), nil
}

func getKubeVersionFromKubectl() *KubeVersion {
	cmd := exec.Command("kubectl", "version", "-o", "json")
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Infof("Failed to query kubectl: %s", err)
		log.Info(err)
	}

	return getVersionFromKubectlOutput(string(out))
}

func getKubeVersionFromKubelet() *KubeVersion {
	cmd := exec.Command("kubelet", "--version")
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Infof("Failed to query kubelet: %s", err)
		log.Info(err)
	}

	return getVersionFromKubeletOutput(string(out))
}

func getVersionFromKubectlOutput(s string) *KubeVersion {
	log.Infof("Kubectl output: %s", s)
	type versionResult struct {
		ServerVersion VersionResponse
	}
	vrObj := &versionResult{}
	if err := json.Unmarshal([]byte(s), vrObj); err != nil {
		log.Info(err)
		if strings.Contains(s, "The connection to the server") {
			msg := fmt.Sprintf(`Warning: Kubernetes version was not auto-detected because kubectl could not connect to the Kubernetes server. This may be because the kubeconfig information is missing or has credentials that do not match the server. Assuming default version %s`, defaultKubeVersion)
			fmt.Fprintln(os.Stderr, msg)
		}
		log.Infof("Unable to get Kubernetes version from kubectl, using default version: %s", defaultKubeVersion)
		return &KubeVersion{baseVersion: defaultKubeVersion}
	}
	sv := vrObj.ServerVersion
	return &KubeVersion{
		Major:      sv.Major,
		Minor:      sv.Minor,
		GitVersion: sv.GitVersion,
	}
}

func getVersionFromKubeletOutput(s string) *KubeVersion {
	log.Infof("Kubelet output: %s", s)
	serverVersionRe := regexp.MustCompile(`Kubernetes v(\d+.\d+)`)
	subs := serverVersionRe.FindStringSubmatch(s)
	if len(subs) < 2 {
		log.Infof("Unable to get Kubernetes version from kubelet, using default version: %s", defaultKubeVersion)
		return &KubeVersion{baseVersion: defaultKubeVersion}
	}
	return &KubeVersion{baseVersion: subs[1]}
}

func makeSubstitutions(s string, ext string, m map[string]string) (string, []string) {
	substitutions := make([]string, 0)
	for k, v := range m {
		subst := "$" + k + ext
		if v == "" {
			log.Infof("No substitution for '%s'\n", subst)
			continue
		}
		log.Infof("Substituting %s with '%s'\n", subst, v)
		beforeS := s
		s = multiWordReplace(s, subst, v)
		if beforeS != s {
			substitutions = append(substitutions, v)
		}
	}

	return s, substitutions
}

func isEmpty(str string) bool {
	return strings.TrimSpace(str) == ""
}

func buildComponentMissingErrorMessage(nodetype check.NodeType, component string, bins []string) string {
	errMessageTemplate := `
Unable to detect running programs for component %q
The following %q programs have been searched, but none of them have been found:
%s

These program names are provided in the config.yaml, section '%s.%s.bins'
`

	var componentRoleName, componentType string
	switch nodetype {

	case check.NODE:
		componentRoleName = "worker node"
		componentType = "node"
	case check.ETCD:
		componentRoleName = "etcd node"
		componentType = "etcd"
	default:
		componentRoleName = "master node"
		componentType = "master"
	}

	binList := ""
	for _, bin := range bins {
		binList = fmt.Sprintf("%s\t- %s\n", binList, bin)
	}

	return fmt.Sprintf(errMessageTemplate, component, componentRoleName, binList, componentType, component)
}

func getPlatformInfo() Platform {

	openShiftInfo := getOpenShiftInfo()
	if openShiftInfo.Name != "" && openShiftInfo.Version != "" {
		return openShiftInfo
	}

	kv, err := getKubeVersion()
	if err != nil {
		log.Info(err)
		return Platform{}
	}
	return getPlatformInfoFromVersion(kv.GitVersion)
}

func getPlatformInfoFromVersion(s string) Platform {
	versionRe := regexp.MustCompile(`v(\d+\.\d+)\.\d+-(\w+)(?:[.\-])\w+`)
	subs := versionRe.FindStringSubmatch(s)
	if len(subs) < 3 {
		return Platform{}
	}
	return Platform{
		Name:    subs[2],
		Version: subs[1],
	}
}

func getPlatformBenchmarkVersion(platform Platform) string {
	log.Infof("getPlatformBenchmarkVersion platform: %s", platform)
	switch platform.Name {
	case "eks":
		return "eks-1.1.0"
	case "gke":
		switch platform.Version {
		case "1.15", "1.16", "1.17", "1.18", "1.19":
			return "gke-1.0"
		default:
			return "gke-1.2.0"
		}
	case "aliyun":
		return "ack-1.0"
	case "ocp":
		switch platform.Version {
		case "3.10":
			return "rh-0.7"
		case "4.1":
			return "rh-1.0"
		}
	}
	return ""
}

func getOpenShiftInfo() Platform {
	log.Info("Checking for oc")
	_, err := exec.LookPath("oc")

	if err == nil {
		cmd := exec.Command("oc", "version")
		out, err := cmd.CombinedOutput()

		if err == nil {
			versionRe := regexp.MustCompile(`oc v(\d+\.\d+)`)
			subs := versionRe.FindStringSubmatch(string(out))
			if len(subs) < 1 {
				versionRe = regexp.MustCompile(`Client Version:\s*(\d+\.\d+)`)
				subs = versionRe.FindStringSubmatch(string(out))
			}
			if len(subs) > 1 {
				log.Infof("OCP output '%s' \nplatform is %s \nocp %v", string(out), getPlatformInfoFromVersion(string(out)), subs[1])
				ocpBenchmarkVersion, err := getOcpValidVersion(subs[1])
				if err == nil {
					return Platform{Name: "ocp", Version: ocpBenchmarkVersion}
				} else {
					log.Infof("Can't get getOcpValidVersion: %v", err)
				}
			} else {
				log.Infof("Can't parse version output: %v", subs)
			}
		} else {
			log.Infof("Can't use oc command: %v", err)
		}
	} else {
		log.Infof("Can't find oc command: %v", err)
	}
	return Platform{}
}

func getOcpValidVersion(ocpVer string) (string, error) {
	ocpOriginal := ocpVer

	for !isEmpty(ocpVer) {
		log.Infof("getOcpBenchmarkVersion check for ocp: %q \n", ocpVer)
		if ocpVer == "3.10" || ocpVer == "4.1" {
			log.Infof("getOcpBenchmarkVersion found valid version for ocp: %q \n", ocpVer)
			return ocpVer, nil
		}
		ocpVer = decrementVersion(ocpVer)
	}

	log.Infof("getOcpBenchmarkVersion unable to find a match for: %q", ocpOriginal)
	return "", fmt.Errorf("unable to find a matching Benchmark Version match for ocp version: %s", ocpOriginal)
}
