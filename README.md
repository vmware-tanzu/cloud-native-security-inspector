# Cloud Native Security Inspector (Project Narrows)
[![CodeQL](https://github.com/vmware-tanzu/cloud-native-security-inspector/actions/workflows/codeql.yml/badge.svg)](https://github.com/vmware-tanzu/cloud-native-security-inspector/actions/workflows/codeql.yml)
[![Cypress](https://github.com/vmware-tanzu/cloud-native-security-inspector/actions/workflows/cypress.yml/badge.svg?branch=main)](https://github.com/vmware-tanzu/cloud-native-security-inspector/actions/workflows/cypress.yml)
[![ci](https://github.com/vmware-tanzu/cloud-native-security-inspector/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/bahmutov/cypress-set-github-status/actions/workflows/main.yml)

Cloud Native Security Inspector is an open source cloud native runtime security tool. It allows end users to assess
the security posture of Kubernetes clusters at runtime. This project will add dynamic scanning giving Security Auditors
greater awareness and control of running workloads.

## Features 
- View overall security posture of applications in runtime
- Policy-based scanning management
- Revise baseline policies as needed and prevent redeploying workloads sourced from vulnerable images
- Quarantine non-secure workloads
- Review and filter the assessment reports
- Event-driven K8s configuration security monitoring
- Open framework for any scanner and any report consumer

## Architecture
  <img src="./docs/pictures/architecture.png">  

**Cloud Native Security Inspector** consists of the following components:
1. **The Controller Manager**: Helps to reconcile the Setting and InspectionPolicy CR, then provision the scanner workloads.
2. **The Portal**: The UI developed by Narrows core team, by which you can do Setting/Policy management, review the reports and check the overall security postures.
3. **The Exporter**: The exporter is a hub between the scanners and the report consumers. Any scanner can send a report to the exporter as long as it follows the protocol. The exporter is also easy to be extended to support more report consumers.
4. **The report consumers**: The consumers are where to export the security report to. Currently the Exporter supports exporting reports to Opensearch and Elasticsearch. However, due to the license limitation, only OpenSearch is integrated with the Portal. Our Helm chart and deploy.sh file can install an opensearch for you.

With regards to scanners, currently we support 3 different kinds of scanners:
### [Image vulnerability scanner](https://goharbor.io/docs/main/administration/vulnerability-scanning/)
Harbor provides static analysis of vulnerabilities in images through the open source projects [Trivy](https://github.com/aquasecurity/trivy).
In CNSI, this capability is used to perform [dynamic security application testing](https://www.gartner.com/en/information-technology/glossary/dynamic-application-security-testing-dast) (DAST).

### [Kubebench scanner](https://github.com/aquasecurity/kube-bench)
Kubebench scanner mainly cares about the underlying Kubernetes cluster.
It checks whether Kubernetes is deployed securely by running the checks documented in the [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes/).

### [Risk Scanner (contributed by Arksec Beijing Ltd)](https://arksec.cn/)
The Risk scanner fetches the [CVSS vectors](https://qualysguard.qg2.apps.qualys.com/qwebhelp/fo_portal/setup/cvss_vector_strings.htm)
from the image vulnerability report, then reports scored-risks it observed in the vector.

## Demo
[Video Demo](https://youtu.be/IMxU0UWo-DU) - Demo for Cloud Native Security Inspector features

## Prerequisites
- Ubuntu Linux as the operating system of the installation machine
- [Kubernetes](https://kubernetes.io/) 1.24
- [Harbor](https://goharbor.io/) 2.5.0+ is deployed and [vulnerability scanning in Harbor](https://goharbor.io/docs/main/administration/vulnerability-scanning/) is configured properly.
- [kubectl](https://kubernetes.io/docs/reference/kubectl/) and docker commands are ready to use.

## Deployment & Run
There are 2 options to deploy project Narrows if you would like to use the pre-built images from `projects.registry.vmware.com`.

### Option 1: Using Helm chart
Check this [doc](deployments/charts/cnsi/README.md) for details.

### Option 2: Using our deploy.sh script
You need to clone the source code if you choose this option.
```shell
$ git clone https://github.com/vmware-tanzu/cloud-native-security-inspector.git
$ cd cloud-native-security-inspector
$ ./deploy.sh install
```
If you would like to build your customized image, you call follow below steps:
```shell
$ git clone https://github.com/vmware/cloud-native-security-inspector.git
```
Before building the images, please ensure you have installed and configured the golang SDK correctly. To install the golang SDK, please familiarize yourself with the [Golang documentation](https://go.dev/doc/install).

Use the following commands to compile the source code and build the docker images, and deployed to your K8s cluster.
```shell
$ cd cloud-native-security-inspector
$ ./deploy.sh install --build-source
```

### Verifying the deployment
You can use the following command to see if all the components have been started successfully in Kubernetes.

```shell
~ → kubectl get all -n cnsi-system
NAME                                                          READY   STATUS    RESTARTS         AGE
pod/cloud-native-security-inspector-portal-7b4fb65c59-6nzmk   1/1     Running   0                17h
pod/cnsi-controller-manager-5586dcc798-znvqp                  2/2     Running   37 (6m51s ago)   17h
pod/cnsi-exporter-69c786c9f-8frmk                             1/1     Running   0                17h

NAME                                                     TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/cloud-native-security-inspector-portal-service   NodePort    10.102.75.93    <none>        3800:30150/TCP   17h
service/cnsi-controller-manager-metrics-service          ClusterIP   10.99.21.250    <none>        8443/TCP         17h
service/cnsi-exporter-service                            ClusterIP   10.104.26.251   <none>        6780/TCP         17h

NAME                                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/cloud-native-security-inspector-portal   1/1     1            1           17h
deployment.apps/cnsi-controller-manager                  1/1     1            1           17h
deployment.apps/cnsi-exporter                            1/1     1            1           17h

NAME                                                                DESIRED   CURRENT   READY   AGE
replicaset.apps/cloud-native-security-inspector-portal-7b4fb65c59   1         1         1       17h
replicaset.apps/cnsi-controller-manager-5586dcc798                  1         1         1       17h
replicaset.apps/cnsi-exporter-69c786c9f                             1         1         1       17h
```

### Run
- Refer to the [Tutorial](docs/TUTORIAL.md) for a quick guidance.
- Refer to the [User Guide](docs/USER-GUIDE.md) for more details on how to use Cloud Native Security Inspector.

### Uninstalling
To uninstall Cloud Native Security Inspector, use the following command:
```shell
$ ./deploy.sh uninstall 
```
For more details, please refer to the [User Guide](docs/USER-GUIDE.md).

## Contact us
Email: narrows@vmware.com  

## License
Cloud Native Security Inspector is available under the [Apache 2 license](LICENSE).
