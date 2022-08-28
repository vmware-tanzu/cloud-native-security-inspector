#!/bin/bash
set -e

usage=$'Please set --with-portal if needs enable portal.
Please set --build-source if needs build from scratch.'


with_portal=true
build_source=$false
install=$false
uninstall=$false

while [ $# -gt 0 ]; do
        case $1 in
            --help)
            echo $usage
            exit 0;;
            install)
            install=true;;
            --with-portal)
            with_portal=true;;
            --build-source)
            build_source=true;;
            uninstall)
            uninstall=true;;
            *)
            echo $usage
            exit 1;;
        esac
        shift || true
done


cd src/
if [ $install ] && [ $with_portal ]
then
    make deploy
fi

if [ $install ] && [ $with_portal != "true" ]
then
    make deploy
fi


if [ $install ] && [ $build_source ]
then
    make docker-build-manager
    make docker-build-inspector
    make docker-build-portal
    make docker-push
    make deploy
fi

if [ $uninstall ]
then
    make undeploy
fi
