#! /usr/bin/bash

max_retry_count=50
while :
pod_count=2
do
  for line in `kubectl get po -n cnsi-system -ojson|jq '.|{key: .items[].status.phase}'|jq '.[]'`
  do
    if [[ $line == "\"Running\"" ]]
    then
      echo "Pod ready"
      ((pod_count--))
    else
      echo "Pod not ready"
      break
    fi
    if [[ $pod_count -eq 0  ]]
    then
      echo "All ready!"
      exit 0
    fi
    
    ((max_retry_count--))
    if [[ $max_retry_count -eq 0  ]]
    then
      echo "Exceed max retry times."
      exit -1
    fi
  done
  sleep 1
  kubectl get po -n  cnsi-system  -owide
done