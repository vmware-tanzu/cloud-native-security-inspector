# Open-Source Software Inspection with VMware Application Catalog (EXPERIMENTAL)

Project Narrows can be integrated with VMware Application Catalog (VAC) to enable inspection use cases related to Open-Source Softwae (OSS) management and governance.

## About VMware Application Catalog

[VMware Application Catalog](https://tanzu.vmware.com/application-catalog) is a customizable selection of trusted, pre-packaged application components that are continuously maintained and verifiably tested for use in production environments. These images are built on custom base operating system images and deposited into a private repository. Every artifact has a complete set of metadata that proves the trustworthiness of the software within, easily accessible through a centralized UI. VAC is an enterprise offering from VMware built on top of the [Bitnami](https://www.bitnami.com) ecosystem.

## Open-Source Software Inspection

Integration with VAC opens several OSS inspection usecases for this Cloud-Native Security Inspector (CNS). Example scenarios could be:

- Detect, flag and/or prevent in certain namespaces the use of OSS solutions that haven't been curated by a trusted provider. Users of CNSI and VAC can create policies that react when certain namespaces contain workloads that are unknown and haven't been provisioned through VAC registry. An example could be an engineering team provisioning a MariaDB database that has been pulled from a non-trusted registry at DockerHub. Pulling software from untrusted arbitrary provides can become an important security risk for corporations of any size.

- Detect OSS workloads that are using deprecated OSS. An example is an NGinx deployment running on 1.21 and that has gone End-of-Life (EOL) months ago. EOL'ed software is very difficult to detect and an important liability as not only won't have official support but also might be not patched for security fixes. The ability to detect deprecated OSS is a very attractive use case for corporations.

- Advanced OSS upgrade policies. Kubernetes [offers some very basic](https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy) support for auto-upgrade policies that pretty much limit to always or never update. Many companies find this quite limiting. Combining CNSI and VAC could provide support for smarter upgrade policies like for example upgrade when certain vulnerabilities have been detected, upgrade only to patch releases, or to minor/major, or perhaps custom specific user-driven combinations. 

## Architecture
  <img src="./pictures/governor.png">  

Integration with VAC is very straightforward. As long as you have access to a VAC environment you will be able to link your CNSI inspection policy to the VAC governor backend. From that moment, CNSI will use the VAC Governor component both to deliver inspection assessment data and to use the Governor backend to detect trusted software, deprecations and any other governance capability implemented over time. 

## Disclaimer
When using the Governor component with CNSI and VAC, assessment report telemetry data is sent to VMware. If you don't will to send any data to our systems then you should avoid turning on the Governance capability.

## 2 Minutes Setup
To Be Done
