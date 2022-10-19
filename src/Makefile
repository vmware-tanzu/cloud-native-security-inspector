# Copyright 2022 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0
# Commands
DOCKERCMD=$(shell which docker)
KUBECTLCMD=$(shell which kubectl)
SWAGGER := $(DOCKERCMD) run --rm -it -v $(HOME):$(HOME) -w $(shell pwd) quay.io/goswagger/swagger

REGISTRY ?= projects.registry.vmware.com/cnsi
# Image URL to use all building/pushing image targets
IMG ?= $(REGISTRY)/manager:0.1
IMG_CMD ?= $(REGISTRY)/inspector:0.1
PORTAl ?= $(REGISTRY)/portal:0.1
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

all: build

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
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

manifests: controller-gen ## Generate WebhookConfiguration, ClusterRole and CustomResourceDefinition objects.
	$(CONTROLLER_GEN) $(CRD_OPTIONS) rbac:roleName=manager-role webhook paths="./..." output:crd:artifacts:config=config/crd/bases

generate: controller-gen ## Generate code containing DeepCopy, DeepCopyInto, and DeepCopyObject method implementations.
	$(CONTROLLER_GEN) object:headerFile="hack/boilerplate.go.txt" paths="./..."

tidy: ## Run go mod tidy
	go mod tidy

fmt: ## Run go fmt against code.
	go fmt ./...

vet: ## Run go vet against code.
	go vet ./...

ENVTEST_ASSETS_DIR=$(shell pwd)/testbin
test: manifests generate fmt vet ## Run tests.
	mkdir -p ${ENVTEST_ASSETS_DIR}
	test -f ${ENVTEST_ASSETS_DIR}/setup-envtest.sh || curl -sSLo ${ENVTEST_ASSETS_DIR}/setup-envtest.sh https://raw.githubusercontent.com/kubernetes-sigs/controller-runtime/v0.8.3/hack/setup-envtest.sh
	source ${ENVTEST_ASSETS_DIR}/setup-envtest.sh; fetch_envtest_tools $(ENVTEST_ASSETS_DIR); setup_envtest_env $(ENVTEST_ASSETS_DIR); go test ./... -coverprofile cover.out

##@ Build

build-manager: tidy generate fmt vet ## Build manager binary.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/manager main.go

build-inspector: tidy generate fmt vet ## Build inspector command.
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o bin/inspector cmd/inspector/main.go

run: manifests generate fmt vet ## Run a controller from your host.
	go run ./main.go

docker-build-manager: test build-manager ## Build docker image with the manager.
	$(DOCKERCMD) build -t ${IMG} .

docker-build-inspector: build-inspector ## Build docker image with inspector cmd.
	$(DOCKERCMD) build -t ${IMG_CMD} -f Dockerfile.inspection.local .

docker-build-portal:
	$(DOCKERCMD) build -t ${PORTAl} -f Dockerfile.portal .

docker-push: ## Push docker images with the manager.
	$(DOCKERCMD) push ${IMG}
	$(DOCKERCMD) push ${IMG_CMD}
	$(DOCKERCMD) push ${PORTAl}

##@ Deployment
namespace:
	$(KUBECTLCMD) create namespace cnsi-system --dry-run=client -o yaml | $(KUBECTLCMD) apply -f -


install: manifests kustomize ## Install CRDs into the K8s cluster specified in ~/.kube/config.
	$(KUSTOMIZE) build config/crd | kubectl apply -f -

uninstall: manifests kustomize ## Uninstall CRDs from the K8s cluster specified in ~/.kube/config.
	$(KUSTOMIZE) build config/crd | kubectl delete -f -

deploy: namespace portal manifests kustomize  ## Deploy controller to the K8s cluster specified in ~/.kube/config.
	cd config/manager && $(KUSTOMIZE) edit set image controller=${IMG}
	$(KUSTOMIZE) build config/default | kubectl apply -f -

deploy-without-portal: manifests kustomize ## Deploy controller to the K8s cluster specified in ~/.kube/config.
	cd config/manager && $(KUSTOMIZE) edit set image controller=${IMG}
	$(KUSTOMIZE) build config/default | kubectl apply -f -

undeploy: ## Undeploy controller from the K8s cluster specified in ~/.kube/config.
	$(KUSTOMIZE) build config/default | kubectl delete -f -

	
portal:
	$(KUBECTLCMD) apply -f frontend/scripts/cloud-native-security-inspector-portal-serviceaccount.yaml
	$(KUBECTLCMD) apply -f frontend/scripts/cloud-native-security-inspector-portal-role.yaml
	$(KUBECTLCMD) apply -f frontend/scripts/cloud-native-security-inspector-portal-rolebinding.yaml
	$(KUBECTLCMD) apply -f frontend/scripts/cloud-native-security-inspector-portal.yaml
	$(KUBECTLCMD) apply -f frontend/scripts/cloud-native-security-inspector-portal-service.yaml


CONTROLLER_GEN = $(shell pwd)/bin/controller-gen
controller-gen: ## Download controller-gen locally if necessary.
	$(call go-get-tool,$(CONTROLLER_GEN),sigs.k8s.io/controller-tools/cmd/controller-gen@v0.4.1)

KUSTOMIZE = $(shell pwd)/bin/kustomize
kustomize: ## Download kustomize locally if necessary.
	$(call go-get-tool,$(KUSTOMIZE),sigs.k8s.io/kustomize/kustomize/v3@v3.8.7)

# go-get-tool will 'go get' any package $2 and install it to $1.
PROJECT_DIR := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
define go-get-tool
@[ -f $(1) ] || { \
set -e ;\
TMP_DIR=$$(mktemp -d) ;\
cd $$TMP_DIR ;\
go mod init tmp ;\
echo "Downloading $(2)" ;\
GOBIN=$(PROJECT_DIR)/bin go get $(2) ;\
rm -rf $$TMP_DIR ;\
}
endef

# Generate Harbor API client
HARBOR_SPEC =./assets/harbor-api/v2.0/swagger.yaml
HARBOR_CLIENT_DIR =./pkg/harbor
gen-harbor-api:
	@$(SWAGGER) generate client -f ${HARBOR_SPEC} --target=$(HARBOR_CLIENT_DIR) --template=stratoscale --additional-initialism=CVE --additional-initialism=GC --additional-initialism=OIDC

