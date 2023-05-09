#!/bin/bash
set -e

usage=$'Run "./deploy install" to install Project Narrows. Please set --build-source if needs build from scratch.'

source deployments/common.sh
set +o noglob

with_portal=true
build_source=$false
install=$false
uninstall=$false

if [ $# -eq 0 ]; then
    error "$usage"
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/deployments/common.sh


function install_redis() {
    note "Installing redis"
    check_helm
    helm install cnsi-scanner --set auth.enabled=false --set tls.authClients=false oci://registry-1.docker.io/bitnamicharts/redis  -n cnsi-system --create-namespace
    success "Redis installed"
}

function uninstall_redis() {
    note "Uninstalling redis"
    check_helm
    helm uninstall cnsi-scanner -n cnsi-system || :
    success "Redis uninstalled"
}


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


if [ $install ] && [ $with_portal ]
then
    check_kubectl
    install_opensearch
    install_redis
    note "Installing Project Narrows"
    make install
    success "Project Narrows installed"
fi

if [ $install ] && [ $with_portal != "true" ]
then
    check_kubectl
    install_opensearch
    install_redis
    note "Installing Project Narrows"
    make install
    success "Project Narrows installed"
fi


if [ $install ] && [ $build_source ]
then
    check_kubectl
    check_docker
    note "Docker build images"
    make docker-build-all
    note "Deploying ..."
    make deploy
    success "Project Narrows installed"
fi

if [ $uninstall ]
then
    check_kubectl
    uninstall_opensearch
    uninstall_redis
    note "Uninstalling Project Narrows..."
    make uninstall
    success "Project Narrows uninstalled"
fi

