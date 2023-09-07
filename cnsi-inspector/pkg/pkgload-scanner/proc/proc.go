package proc

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"
)

type ProcTool struct {
	mountPoint string
}

var k8sPatterns []*regexp.Regexp
var k8sPatternsV2 []*regexp.Regexp

const k8sReg = `(?P<id>\w):cpuset:\/kubepods\/(\w+)\/(.+)\/(?P<container>\w+)`
const k8sLowReg = `(?P<id>\w):cpuset:\/kubepods.slice/(.+)/(.+)/docker-(?P<container>\w+).scope`
const k8sCrioReg = `(?P<id>\w):cpuset:\/kubepods.slice/(.+)/(.+)/crio-(?P<container>\w+).scope`
const k8sContainerdReg = `(?P<id>\w):cpuset:\/kubepods.slice/(.+)/(.+)/cri-containerd-(?P<container>\w+).scope`

const k8sLowRegV2 = `(?P<id>\w)::\/(.+)\/(.+)\/docker-(?P<container>\w+).scope`
const k8sCrioRegV2 = `(?P<id>\w)::\/(.+)\/(.+)\/crio-(?P<container>\w+).scope`
const k8sContainerdRegV2 = `(?P<id>\w)::\/kubepods.slice\/(.+)\/(.+)\/cri-containerd-(?P<container>\w+).scope`

var procTool *ProcTool

func NewProcTool(opt ...func(*ProcTool)) *ProcTool {
	for _, o := range opt {
		o(procTool)
	}
	return procTool
}

func SetMountPoint(mountPoint string) func(*ProcTool) {
	return func(k *ProcTool) {
		k.mountPoint = mountPoint
	}
}

func init() {

	procTool = &ProcTool{
		mountPoint: "/host-proc",
	}

	k8sPatterns = append(k8sPatterns, regexp.MustCompile(k8sReg))
	k8sPatterns = append(k8sPatterns, regexp.MustCompile(k8sLowReg))
	k8sPatterns = append(k8sPatterns, regexp.MustCompile(k8sCrioReg))
	k8sPatterns = append(k8sPatterns, regexp.MustCompile(k8sContainerdReg))

	k8sPatternsV2 = append(k8sPatternsV2, regexp.MustCompile(k8sLowRegV2))
	k8sPatternsV2 = append(k8sPatternsV2, regexp.MustCompile(k8sCrioRegV2))
	k8sPatternsV2 = append(k8sPatternsV2, regexp.MustCompile(k8sContainerdRegV2))

	if s := os.Getenv("CONTAINER_K8S_REGEXP"); s != "" {
		if e := recover(); e != nil {
			fmt.Printf("k8s regexp.MustCompile panic: %v", e)
		}
		reg := regexp.MustCompile(s)
		k8sPatterns = append(k8sPatterns, reg)
	}
}

func (k *ProcTool) GetContainerFromPID(pid int) (container string, err error) {
	for _, pattern := range k8sPatterns {
		fileName := fmt.Sprintf("%s/%d/cgroup", k.mountPoint, pid)
		s, err := k.getContainerFromFile(fileName, pattern)
		if err == nil && s != "" {
			return s, err
		} else {
			if err != nil {
				//return "", err
			}
		}
	}
	for _, patternV2 := range k8sPatternsV2 {
		fileName := fmt.Sprintf("%s/%d/cgroup", k.mountPoint, pid)
		s, err := k.getContainerFromFileV2(fileName, patternV2)
		if err == nil && s != "" {
			//k.Log.Debug().Msgf("k8s A getContainerFromFileV2: container: %s, error :%v", s, err)
			return s, err
		} else {
			if err != nil {
				//return "", err
				//k.Log.Error().Msgf("k8s getContainerFromFileV2: container: %s, error :%v", s, err)
			}
			//k.Log.Error().Msgf("k8s C getContainerFromFileV2: container: %s, error :%v", s, err)
		}
	}

	return "", fmt.Errorf("%w: %d", ErrNoContainerFoundForPID, pid)
}

var ErrNoContainerFoundForPID = errors.New("no container found for pid")
var ErrUnknown = errors.New("unknown error")

func (k *ProcTool) getContainerFromFile(fileName string, pattern *regexp.Regexp) (container string, err error) {
	//k.Log.Debug().Msgf("getContainerFromFile() openfile:%s", fileName)
	file, err := os.Open(fileName)
	if err != nil {
		return "", err
	}

	defer file.Close()

	scanner := bufio.NewScanner(file)
	if err := scanner.Err(); err != nil {
		return "", err
	}

	content, flag := "", false
	for scanner.Scan() {
		m := scanner.Text()
		if strings.Contains(m, "cpuset") {
			flag = true
			content = m
			break
		}
		flag = true
		content = m
	}

	if flag {
		template := []byte("$container")
		var result []byte

		//k.Log.Debug().Msgf("getContainerFromFile content:%s", content)

		// For each match of the regex in the content.
		for _, submatches := range pattern.FindAllSubmatchIndex([]byte(content), -1) {
			// Apply the captured submatches to the template and append the output
			// to the result.
			result = pattern.Expand(result, template, []byte(content), submatches)
		}

		s := string(result)

		return s, nil
	}

	return "", fmt.Errorf("no container id found")
}

func (k *ProcTool) getContainerFromFileV2(fileName string, pattern *regexp.Regexp) (container string, err error) {
	file, err := os.Open(fileName)
	if err != nil {
		return "", err
	}

	defer file.Close()

	scanner := bufio.NewScanner(file)
	if err := scanner.Err(); err != nil {
		return "", nil
	}

	content, flag := "", false
	for scanner.Scan() {
		m := scanner.Text()
		//if strings.Contains(m, "cpuset") {
		//	flag = true
		//	content = m
		//	break
		//}
		flag = true
		content = m
	}

	if flag {
		template := []byte("$container")
		var result []byte

		//k.Log.Debug().Msgf("getContainerFromFileV2 content:%s", content)
		// For each match of the regex in the content.
		for _, submatches := range pattern.FindAllSubmatchIndex([]byte(content), -1) {
			// Apply the captured submatches to the template and append the output
			// to the result.
			result = pattern.Expand(result, template, []byte(content), submatches)
		}

		s := string(result)

		return s, nil
	}

	return "", fmt.Errorf("no container id found")
}
