#! /usr/bin/bash

kubectl wait -n cnsi-system --for=condition=Available deploy/cloud-native-security-inspector-portal --timeout=90s
kubectl wait -n cnsi-system --for=condition=Available deploy/cnsi-controller-manager --timeout=90s
