#!/bin/bash
set -e

usage=$'Run "./deploy install" to install Project Narrows. Please set --build-source if needs build from scratch.'

source src/tools/installation/common.sh
set +o noglob

with_portal=true
build_source=$false
install=$false
uninstall=$false

if [ $# -eq 0 ]; then
    error "$usage"
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/src/tools/installation/common.sh


function install_opensearch() {
    note "Installing opensearch"
    check_helm
    helm repo add opensearch https://opensearch-project.github.io/helm-charts/
    helm repo update
    helm install opensearch-deployment-for-narrows opensearch/opensearch -n opensearch --version 2.8.0 --create-namespace --set persistence.enabled=false
    success "OpenSearch installed"
}

function uninstall_opensearch() {
    note "Uninstalling opensearch"
    check_helm
    helm repo add opensearch https://opensearch-project.github.io/helm-charts/
    helm uninstall opensearch-deployment-for-narrows -n opensearch || :
    success "OpenSearch uninstalled"
}

while [ $# -gt 0 ]; do
        case $1 in
            --help)
            note "$usage"
            exit 0;;
            install)
            install=true;;
            --build-source)
            check_golang
            build_source=true;;
            uninstall)
            uninstall=true;;
            *)
            note "$usage"
            exit 1;;
        esac
        shift || true
done


cd src/
if [ $install ] && [ $with_portal ]
then
    check_kubectl
    install_opensearch
    note "Installing Project Narrows"
    make install
    success "Project Narrows installed"
fi

if [ $install ] && [ $with_portal != "true" ]
then
    check_kubectl
    install_opensearch
    note "Installing Project Narrows"
    make install
    success "Project Narrows installed"
fi


if [ $install ] && [ $build_source ]
then
    check_kubectl
    check_docker
    note "Docker build manager"
    make docker-build-manager
    note "Docker build inspector"
    make docker-build-inspector
    note "Docker build portal"
    make docker-build-portal
    note "Push images to registry"
    make docker-push
    note "Deploying ..."
    make deploy
    success "Project Narrows installed"
fi

if [ $uninstall ]
then
    check_kubectl
    uninstall_opensearch
    note "Uninstalling Project Narrows..."
    make uninstall
    success "Project Narrows uninstalled"
fi

