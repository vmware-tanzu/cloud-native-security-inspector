# Copyright 2022 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0
# Commands
DOCKERCMD=$(shell which docker)
KUBECTLCMD=$(shell which kubectl)
SWAGGER := $(DOCKERCMD) run --rm -it -v $(HOME):$(HOME) -w $(shell pwd) quay.io/goswagger/swagger

REGISTRY ?= projects.registry.vmware.com/cnsi
IMG_TAG = 0.3.2
# Image URL to use all building/pushing image targets
IMG_MANAGER ?= $(REGISTRY)/manager:$(IMG_TAG)
IMG_EXPORTER ?= $(REGISTRY)/exporter:$(IMG_TAG)
IMG_CMD_INSPECTOR ?= $(REGISTRY)/inspector:$(IMG_TAG)
IMG_CMD_TRIVY ?= $(REGISTRY)/trivy:$(IMG_TAG)
IMG_CMD_KUBEBENCH ?= $(REGISTRY)/kubebench:$(IMG_TAG)
PORTAl ?= $(REGISTRY)/portal:$(IMG_TAG)
RISK ?= $(REGISTRY)/risk:$(IMG_TAG)
IMG_CMD_WORKLOAD_SCANNER ?= $(REGISTRY)/workloadscanner:$(IMG_TAG)

# Produce CRDs that work back to Kubernetes 1.11 (no version conversion)
CRD_OPTIONS ?= "crd:trivialVersions=true,preserveUnknownFields=false"

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

# Setting SHELL to bash allows bash commands to be executed by recipes.
# This is a requirement for 'setup-envtest.sh' in the test target.
# Options are set to exit when a recipe line exits non-zero or a piped command fails.
SHELL = /usr/bin/env bash -o pipefail
.SHELLFLAGS = -ec


##@ General

# The help target prints out all targets with their descriptions organized
# beneath their categories. The categories are represented by '##@' and the
# target descriptions by '##'. The awk commands is responsible for reading the
# entire set of makefiles included in this invocation, looking for lines of the
# file as xyz: ## something, and then pretty-format the target and help. Then,
# if there's a line with ##@ something, that gets pretty-printed as a category.
# More info on the usage of ANSI control characters for terminal formatting:
# https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
# More info on the awk command:
# http://linuxcommand.org/lc3_adv_awk.php

help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

manifests: controller-gen ## Generate WebhookConfiguration, ClusterRole and CustomResourceDefinition objects.
	$(CONTROLLER_GEN) $(CRD_OPTIONS) rbac:roleName=manager-role webhook paths="./..." output:crd:artifacts:config=cnsi-manager/config/crd/bases

generate: controller-gen ## Generate code containing DeepCopy, DeepCopyInto, and DeepCopyObject method implementations.
	$(CONTROLLER_GEN) object:headerFile="tools/boilerplate.go.txt" paths="./..."

tidy: ## Run go mod tidy
	go mod tidy

fmt: ## Run go fmt against code.
	go fmt ./...

vet: ## Run go vet against code.
	go vet ./...

ENVTEST_ASSETS_DIR=$(shell pwd)/testbin
test: fmt ## Run tests.
	mkdir -p ${ENVTEST_ASSETS_DIR}
	test -f ${ENVTEST_ASSETS_DIR}/setup-envtest.sh || curl -sSLo ${ENVTEST_ASSETS_DIR}/setup-envtest.sh https://raw.githubusercontent.com/kubernetes-sigs/controller-runtime/v0.8.3/hack/setup-envtest.sh
	source ${ENVTEST_ASSETS_DIR}/setup-envtest.sh; fetch_envtest_tools $(ENVTEST_ASSETS_DIR); setup_envtest_env $(ENVTEST_ASSETS_DIR); go test ./... -coverprofile cover.out

##@ Build binaries

build-manager: generate fmt vet ## Build manager binary.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/manager cnsi-manager/cmd/main.go

build-exporter: fmt vet ## Build exporter binary.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o bin/exporter cnsi-exporter/cmd/main.go

build-image-scanner: generate fmt vet ## Build inspector binary.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o bin/inspector cnsi-inspector/cmd/image-scanner/main.go

build-scanner-trivy: generate fmt ## Build trivy binary.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o bin/trivy cnsi-scanner-trivy/cmd/scanner-trivy/main.go

build-kube-bench: generate fmt vet ## Build kubebench binary.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o bin/kubebench cnsi-inspector/cmd/kube-bench/main.go

build-risk: generate fmt vet ## Build risk binary.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o bin/risk cnsi-inspector/cmd/risk-scanner/main.go

build-workloadscanner: generate fmt vet ## Build workloadscanner binary.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o bin/workloadscanner cnsi-inspector/cmd/workload-scanner/main.go

##@ Build OCI images

docker-build-backend: docker-build-manager docker-build-exporter docker-build-inspector docker-build-kubebench docker-build-risk docker-build-workloadscanner

docker-build-all: docker-build-backend docker-build-portal

docker-build-manager: build-manager ## Build docker image of the manager.
	$(DOCKERCMD) buildx build -t ${IMG_MANAGER} -f deployments/dockerfiles/Dockerfile.manager .

docker-build-exporter: build-exporter ## Build docker image of the exporter.
	$(DOCKERCMD) buildx build -t ${IMG_EXPORTER} -f deployments/dockerfiles/Dockerfile.exporter .

docker-build-portal: ## Build docker image of portal.
	$(DOCKERCMD) buildx build -t ${PORTAl} -f deployments/dockerfiles/Dockerfile.portal .

docker-build-inspector: build-image-scanner ## Build docker image of image scanner.
	$(DOCKERCMD) buildx build -t ${IMG_CMD_INSPECTOR} -f deployments/dockerfiles/Dockerfile.imagescanner .

docker-build-scanner-trivy: build-scanner-trivy ## Build docker image of trivy scanner.
	$(DOCKERCMD) buildx build -t ${IMG_CMD_TRIVY} -f deployments/dockerfiles/Dockerfile.trivy .

docker-build-kubebench: build-kube-bench ## Build docker image of kube-bench scanner.
	$(DOCKERCMD) buildx build -t ${IMG_CMD_KUBEBENCH} -f deployments/dockerfiles/Dockerfile.kubebench .

docker-build-risk: build-risk ## Build docker image of risk scanner.
	$(DOCKERCMD) buildx build -t ${RISK} -f deployments/dockerfiles/Dockerfile.riskmanager .

docker-build-workloadscanner: build-workloadscanner ## Build docker image with workload scanner.
	$(DOCKERCMD) buildx build -t ${IMG_CMD_WORKLOAD_SCANNER} -f deployments/dockerfiles/Dockerfile.workloadscanner .

docker-push-backend: ## Build all the images except portal.
	$(DOCKERCMD) push ${IMG_MANAGER}
	$(DOCKERCMD) push ${IMG_EXPORTER}
	$(DOCKERCMD) push ${IMG_CMD_INSPECTOR}
	$(DOCKERCMD) push ${IMG_CMD_KUBEBENCH}
	$(DOCKERCMD) push ${RISK}
	$(DOCKERCMD) push ${IMG_CMD_WORKLOAD_SCANNER}
	$(DOCKERCMD) push ${IMG_CMD_TRIVY}

docker-push-all: docker-build-all docker-push-backend ## Push all the images to registry.
	$(DOCKERCMD) push ${PORTAl}

##@ Deployment
namespace:
	$(KUBECTLCMD) create namespace cnsi-system --dry-run=client -o yaml | $(KUBECTLCMD) apply -f -


gen-yaml-files: manifests kustomize ## Install CRDs into the K8s cluster specified in ~/.kube/config.
	cd cnsi-manager/config/manager && $(KUSTOMIZE) edit set image controller=${IMG_MANAGER}
	$(KUSTOMIZE) build cnsi-manager/config/default > deployments/yaml/manager.yaml

remove_clusterrolebinding:
	$(KUBECTLCMD) delete clusterrolebinding cnsi-inspector-rolebinding --ignore-not-found=true

portal: namespace  ## Install CNSI portal
	$(KUBECTLCMD) apply -f cnsi-portal/scripts/cloud-native-security-inspector-portal-serviceaccount.yaml
	$(KUBECTLCMD) apply -f cnsi-portal/scripts/cloud-native-security-inspector-portal-role.yaml
	$(KUBECTLCMD) apply -f cnsi-portal/scripts/cloud-native-security-inspector-portal-rolebinding.yaml
	$(KUBECTLCMD) apply -f cnsi-portal/scripts/cloud-native-security-inspector-portal.yaml
	$(KUBECTLCMD) apply -f cnsi-portal/scripts/cloud-native-security-inspector-portal-service.yaml


install: portal ## Install all the CNSI components without golang and kustomize required.
	$(KUBECTLCMD) apply -f deployments/yaml/manager.yaml
	$(KUBECTLCMD) apply -f deployments/yaml/data-exporter.yaml

uninstall: remove_clusterrolebinding  ## Uninstall CNSI components
	$(KUBECTLCMD) delete -f deployments/yaml/manager.yaml --ignore-not-found=true
	$(KUBECTLCMD) delete -f deployments/yaml/data-exporter.yaml --ignore-not-found=true

CONTROLLER_GEN = $(shell pwd)/bin/controller-gen
controller-gen: tidy ## Download controller-gen locally if necessary.
	$(call go-get-tool,$(CONTROLLER_GEN),sigs.k8s.io/controller-tools/cmd/controller-gen@v0.4.1)

KUSTOMIZE = $(shell pwd)/bin/kustomize
kustomize: ## Download kustomize locally if necessary.
	$(call go-get-tool,$(KUSTOMIZE),sigs.k8s.io/kustomize/kustomize/v4@v4.5.7)

# go-get-tool will 'go get' any package $2 and install it to $1.
PROJECT_DIR := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
define go-get-tool
@[ -f $(1) ] || { \
set -e ;\
TMP_DIR=$$(mktemp -d) ;\
cd $$TMP_DIR ;\
go mod init tmp ;\
echo "Downloading $(2)" ;\
GOBIN=$(PROJECT_DIR)/bin go install $(2) ;\
rm -rf $$TMP_DIR ;\
}
endef

# Generate Harbor API client
HARBOR_SPEC =./assets/harbor-api/v2.0/swagger.yaml
HARBOR_CLIENT_DIR =./pkg/harbor
gen-harbor-api:
	@$(SWAGGER) generate client -f ${HARBOR_SPEC} --target=$(HARBOR_CLIENT_DIR) --template=stratoscale --additional-initialism=CVE --additional-initialism=GC --additional-initialism=OIDC

run: manifests generate fmt vet ## Run a controller from your host.
	go run cnsi-manager/cmd/main.go
