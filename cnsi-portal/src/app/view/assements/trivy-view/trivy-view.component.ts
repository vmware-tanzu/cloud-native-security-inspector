import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { TrivyViewDetailComponent } from 'src/app/view/assements/trivy-view-detail/trivy-view-detail.component'
@Component({
  selector: 'app-trivy-view',
  templateUrl: './trivy-view.component.html',
  styleUrls: ['./trivy-view.component.less']
})
export class TrivyViewComponent implements OnInit, AfterViewInit {
  @ViewChild('pagination') pagination:any
  @ViewChild('trivyDetail') trivyDetail!: TrivyViewDetailComponent
  trivyList = [
    {
      "SchemaVersion": 2,
      "ArtifactName": "test-misconfig:0.1",
      "ArtifactType": "container_image",
      "Metadata": {
      "OS": {
      "Family": "ubuntu",
      "Name": "16.04"
      },
      "ImageID": "sha256:5795cb54187aa8e5478d6883411dfb4950b0a10d1df7a1060956169a6ed22099",
      "DiffIDs": [
      "sha256:1e0a42ab847535b9aca5c8105e75da1b2b300e823342a7c9f4f3b295b823848b",
      "sha256:afbf6106bfe36e91771846153065fe98aaec1dbd069c8f86b4ab05b50e4767b7",
      "sha256:dc01383fd43448f8689e72bbf7f4d21f49b9a80bbdfd2836367cc9ba2525ccbe",
      "sha256:de903087898da12ff2736f5399f07232b3196974551347fcb1bdf9972d45b916",
      "sha256:71295e94372fb1a251defb5ff6779317ae041b344be4efb97c42cdb5e54aa5b2",
      "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      ],
      "RepoTags": [
      "test-misconfig:0.1"
      ],
      "ImageConfig": {
      "architecture": "amd64",
      "created": "2023-03-15T05:17:46.28177777Z",
      "history": [
      {
      "created": "2017-08-07T23:50:27Z",
      "created_by": "/bin/sh -c #(nop) ADD file:fb17197475bb59bfb365c41f28d4bc15134b8dcb8907819e7be54bce53328c03 in / "
      },
      {
      "created": "2017-08-07T23:50:27Z",
      "created_by": "/bin/sh -c #(nop) CMD [\"/bin/bash\"]",
      "empty_layer": true
      },
      {
      "created": "2017-10-10T21:48:11Z",
      "created_by": "/bin/sh -c #(nop) COPY file:499f7bbe5784c6b224634113009b3e1bf98e67ba2adcdcb887716e4445ae6ad3 in /tmp "
      },
      {
      "created": "2017-10-10T22:00:45Z",
      "created_by": "/bin/sh -c /tmp/build.sh"
      },
      {
      "created": "2017-10-10T22:00:46Z",
      "created_by": "/bin/sh -c ln -sf /dev/stdout /var/log/nginx/access.log"
      },
      {
      "created": "2017-10-10T22:00:47Z",
      "created_by": "/bin/sh -c ln -sf /dev/stderr /var/log/nginx/error.log"
      },
      {
      "created": "2017-10-10T22:00:47Z",
      "created_by": "/bin/sh -c #(nop) EXPOSE 443/tcp 80/tcp",
      "empty_layer": true
      },
      {
      "created": "2017-10-10T22:00:47Z",
      "created_by": "/bin/sh -c #(nop) CMD [\"nginx\" \"-g\" \"daemon off;\"]",
      "empty_layer": true
      },
      {
      "created": "2023-03-15T05:17:46Z",
      "created_by": "COPY ./data / # buildkit",
      "comment": "buildkit.dockerfile.v0"
      }
      ],
      "os": "linux",
      "rootfs": {
      "type": "layers",
      "diff_ids": [
      "sha256:1e0a42ab847535b9aca5c8105e75da1b2b300e823342a7c9f4f3b295b823848b",
      "sha256:afbf6106bfe36e91771846153065fe98aaec1dbd069c8f86b4ab05b50e4767b7",
      "sha256:dc01383fd43448f8689e72bbf7f4d21f49b9a80bbdfd2836367cc9ba2525ccbe",
      "sha256:de903087898da12ff2736f5399f07232b3196974551347fcb1bdf9972d45b916",
      "sha256:71295e94372fb1a251defb5ff6779317ae041b344be4efb97c42cdb5e54aa5b2",
      "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      ]
      },
      "config": {
      "Cmd": [
      "nginx",
      "-g",
      "daemon off;"
      ],
      "Env": [
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
      ],
      "ArgsEscaped": true
      }
      }
      },
      "Results": [
      {
      "Target": "Dockerfile",
      "Class": "config",
      "Type": "dockerfile",
      "MisconfSummary": {
      "Successes": 21,
      "Failures": 3,
      "Exceptions": 0
      },
      "Misconfigurations": [
      {
      "Type": "Dockerfile Security Check",
      "ID": "DS002",
      "AVDID": "AVD-DS-0002",
      "Title": "Image user should not be 'root'",
      "Description": "Running containers with 'root' user can lead to a container escape situation. It is a best practice to run containers as non-root users, which can be done by adding a 'USER' statement to the Dockerfile.",
      "Message": "Specify at least 1 USER command in Dockerfile with non-root user as argument",
      "Namespace": "builtin.dockerfile.DS002",
      "Query": "data.builtin.dockerfile.DS002.deny",
      "Resolution": "Add 'USER \u003cnon root user name\u003e' line to the Dockerfile",
      "Severity": "HIGH",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ds002",
      "References": [
      "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/",
      "https://avd.aquasec.com/misconfig/ds002"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Dockerfile",
      "Service": "general",
      "Code": {
      "Lines": null
      }
      }
      },
      {
      "Type": "Dockerfile Security Check",
      "ID": "DS025",
      "AVDID": "AVD-DS-0025",
      "Title": "'apk add' is missing '--no-cache'",
      "Description": "You should use 'apk add' with '--no-cache' to clean package cached data and reduce image size.",
      "Message": "'--no-cache' is missed: apk add bash",
      "Namespace": "builtin.dockerfile.DS025",
      "Query": "data.builtin.dockerfile.DS025.deny",
      "Resolution": "Add '--no-cache' to 'apk add' in Dockerfile",
      "Severity": "HIGH",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ds025",
      "References": [
      "https://github.com/gliderlabs/docker-alpine/blob/master/docs/usage.md#disabling-cache",
      "https://avd.aquasec.com/misconfig/ds025"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Dockerfile",
      "Service": "general",
      "StartLine": 3,
      "EndLine": 3,
      "Code": {
      "Lines": [
      {
      "Number": 3,
      "Content": "RUN apk add bash",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Dockerfile Security Check",
      "ID": "DS026",
      "AVDID": "AVD-DS-0026",
      "Title": "No HEALTHCHECK defined",
      "Description": "You shoud add HEALTHCHECK instruction in your docker container images to perform the health check on running containers.",
      "Message": "Add HEALTHCHECK instruction in your Dockerfile",
      "Namespace": "builtin.dockerfile.DS026",
      "Query": "data.builtin.dockerfile.DS026.deny",
      "Resolution": "Add HEALTHCHECK instruction in Dockerfile",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ds026",
      "References": [
      "https://blog.aquasec.com/docker-security-best-practices",
      "https://avd.aquasec.com/misconfig/ds026"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Dockerfile",
      "Service": "general",
      "Code": {
      "Lines": null
      }
      }
      }
      ]
      },
      {
      "Target": "yaml/data-exporter.yaml",
      "Class": "config",
      "Type": "kubernetes",
      "MisconfSummary": {
      "Successes": 141,
      "Failures": 10,
      "Exceptions": 0
      },
      "Misconfigurations": [
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV003",
      "AVDID": "AVD-KSV-0003",
      "Title": "Default capabilities not dropped",
      "Description": "The container should drop all default capabilities and add only those that are needed for its execution.",
      "Message": "Container 'exporter' of Deployment 'cnsi-exporter' should add 'ALL' to 'securityContext.capabilities.drop'",
      "Namespace": "builtin.kubernetes.KSV003",
      "Query": "data.builtin.kubernetes.KSV003.deny",
      "Resolution": "Add 'ALL' to containers[].securityContext.capabilities.drop.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv003",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-capabilities-drop-index-all/",
      "https://avd.aquasec.com/misconfig/ksv003"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV011",
      "AVDID": "AVD-KSV-0011",
      "Title": "CPU not limited",
      "Description": "Enforcing CPU limits prevents DoS via resource exhaustion.",
      "Message": "Container 'exporter' of Deployment 'cnsi-exporter' should set 'resources.limits.cpu'",
      "Namespace": "builtin.kubernetes.KSV011",
      "Query": "data.builtin.kubernetes.KSV011.deny",
      "Resolution": "Set a limit value under 'containers[].resources.limits.cpu'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv011",
      "References": [
      "https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-resource-requests-and-limits",
      "https://avd.aquasec.com/misconfig/ksv011"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV014",
      "AVDID": "AVD-KSV-0014",
      "Title": "Root file system is not read-only",
      "Description": "An immutable root file system prevents applications from writing to their local disk. This can limit intrusions, as attackers will not be able to tamper with the file system or write foreign executables to disk.",
      "Message": "Container 'exporter' of Deployment 'cnsi-exporter' should set 'securityContext.readOnlyRootFilesystem' to true",
      "Namespace": "builtin.kubernetes.KSV014",
      "Query": "data.builtin.kubernetes.KSV014.deny",
      "Resolution": "Change 'containers[].securityContext.readOnlyRootFilesystem' to 'true'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv014",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-readonlyrootfilesystem-true/",
      "https://avd.aquasec.com/misconfig/ksv014"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV015",
      "AVDID": "AVD-KSV-0015",
      "Title": "CPU requests not specified",
      "Description": "When containers have resource requests specified, the scheduler can make better decisions about which nodes to place pods on, and how to deal with resource contention.",
      "Message": "Container 'exporter' of Deployment 'cnsi-exporter' should set 'resources.requests.cpu'",
      "Namespace": "builtin.kubernetes.KSV015",
      "Query": "data.builtin.kubernetes.KSV015.deny",
      "Resolution": "Set 'containers[].resources.requests.cpu'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv015",
      "References": [
      "https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-resource-requests-and-limits",
      "https://avd.aquasec.com/misconfig/ksv015"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV016",
      "AVDID": "AVD-KSV-0016",
      "Title": "Memory requests not specified",
      "Description": "When containers have memory requests specified, the scheduler can make better decisions about which nodes to place pods on, and how to deal with resource contention.",
      "Message": "Container 'exporter' of Deployment 'cnsi-exporter' should set 'resources.requests.memory'",
      "Namespace": "builtin.kubernetes.KSV016",
      "Query": "data.builtin.kubernetes.KSV016.deny",
      "Resolution": "Set 'containers[].resources.requests.memory'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv016",
      "References": [
      "https://kubesec.io/basics/containers-resources-limits-memory/",
      "https://avd.aquasec.com/misconfig/ksv016"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV018",
      "AVDID": "AVD-KSV-0018",
      "Title": "Memory not limited",
      "Description": "Enforcing memory limits prevents DoS via resource exhaustion.",
      "Message": "Container 'exporter' of Deployment 'cnsi-exporter' should set 'resources.limits.memory'",
      "Namespace": "builtin.kubernetes.KSV018",
      "Query": "data.builtin.kubernetes.KSV018.deny",
      "Resolution": "Set a limit value under 'containers[].resources.limits.memory'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv018",
      "References": [
      "https://kubesec.io/basics/containers-resources-limits-memory/",
      "https://avd.aquasec.com/misconfig/ksv018"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV020",
      "AVDID": "AVD-KSV-0020",
      "Title": "Runs with low user ID",
      "Description": "Force the container to run with user ID \u003e 10000 to avoid conflicts with the host’s user table.",
      "Message": "Container 'exporter' of Deployment 'cnsi-exporter' should set 'securityContext.runAsUser' \u003e 10000",
      "Namespace": "builtin.kubernetes.KSV020",
      "Query": "data.builtin.kubernetes.KSV020.deny",
      "Resolution": "Set 'containers[].securityContext.runAsUser' to an integer \u003e 10000.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv020",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-runasuser/",
      "https://avd.aquasec.com/misconfig/ksv020"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV021",
      "AVDID": "AVD-KSV-0021",
      "Title": "Runs with low group ID",
      "Description": "Force the container to run with group ID \u003e 10000 to avoid conflicts with the host’s user table.",
      "Message": "Container 'exporter' of Deployment 'cnsi-exporter' should set 'securityContext.runAsGroup' \u003e 10000",
      "Namespace": "builtin.kubernetes.KSV021",
      "Query": "data.builtin.kubernetes.KSV021.deny",
      "Resolution": "Set 'containers[].securityContext.runAsGroup' to an integer \u003e 10000.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv021",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-runasuser/",
      "https://avd.aquasec.com/misconfig/ksv021"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV030",
      "AVDID": "AVD-KSV-0030",
      "Title": "Default Seccomp profile not set",
      "Description": "The RuntimeDefault/Localhost seccomp profile must be required, or allow specific additional profiles.",
      "Message": "Either Pod or Container should set 'securityContext.seccompProfile.type' to 'RuntimeDefault'",
      "Namespace": "builtin.kubernetes.KSV030",
      "Query": "data.builtin.kubernetes.KSV030.deny",
      "Resolution": "Set 'spec.securityContext.seccompProfile.type', 'spec.containers[*].securityContext.seccompProfile' and 'spec.initContainers[*].securityContext.seccompProfile' to 'RuntimeDefault' or undefined.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv030",
      "References": [
      "https://kubernetes.io/docs/concepts/security/pod-security-standards/#restricted",
      "https://avd.aquasec.com/misconfig/ksv030"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV106",
      "AVDID": "AVD-KSV-0106",
      "Title": "Container capabilities must only include NET_BIND_SERVICE",
      "Description": "Containers must drop ALL capabilities, and are only permitted to add back the NET_BIND_SERVICE capability.",
      "Message": "container should drop all",
      "Namespace": "builtin.kubernetes.KSV106",
      "Query": "data.builtin.kubernetes.KSV106.deny",
      "Resolution": "Set 'spec.containers[*].securityContext.capabilities.drop' to 'ALL' and only add 'NET_BIND_SERVICE' to 'spec.containers[*].securityContext.capabilities.add'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv106",
      "References": [
      "https://kubernetes.io/docs/concepts/security/pod-security-standards/#restricted",
      "https://avd.aquasec.com/misconfig/ksv106"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 17,
      "EndLine": 24,
      "Code": {
      "Lines": [
      {
      "Number": 17,
      "Content": " - image: projects.registry.vmware.com/cnsi/exporter:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 18,
      "Content": " imagePullPolicy: IfNotPresent",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 19,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 20,
      "Content": " - containerPort: 6780",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 21,
      "Content": " name: http",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 22,
      "Content": " name: exporter",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 23,
      "Content": " securityContext:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 24,
      "Content": " allowPrivilegeEscalation: false",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      }
      ]
      },
      {
      "Target": "yaml/manager.yaml",
      "Class": "config",
      "Type": "kubernetes",
      "MisconfSummary": {
      "Successes": 141,
      "Failures": 24,
      "Exceptions": 0
      },
      "Misconfigurations": [
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV001",
      "AVDID": "AVD-KSV-0001",
      "Title": "Process can elevate its own privileges",
      "Description": "A program inside the container can elevate its own privileges and run as root, which might give the program control over the container and node.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should set 'securityContext.allowPrivilegeEscalation' to false",
      "Namespace": "builtin.kubernetes.KSV001",
      "Query": "data.builtin.kubernetes.KSV001.deny",
      "Resolution": "Set 'set containers[].securityContext.allowPrivilegeEscalation' to 'false'.",
      "Severity": "MEDIUM",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv001",
      "References": [
      "https://kubernetes.io/docs/concepts/security/pod-security-standards/#restricted",
      "https://avd.aquasec.com/misconfig/ksv001"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV001",
      "AVDID": "AVD-KSV-0001",
      "Title": "Process can elevate its own privileges",
      "Description": "A program inside the container can elevate its own privileges and run as root, which might give the program control over the container and node.",
      "Message": "Container 'manager' of Deployment 'cnsi-controller-manager' should set 'securityContext.allowPrivilegeEscalation' to false",
      "Namespace": "builtin.kubernetes.KSV001",
      "Query": "data.builtin.kubernetes.KSV001.deny",
      "Resolution": "Set 'set containers[].securityContext.allowPrivilegeEscalation' to 'false'.",
      "Severity": "MEDIUM",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv001",
      "References": [
      "https://kubernetes.io/docs/concepts/security/pod-security-standards/#restricted",
      "https://avd.aquasec.com/misconfig/ksv001"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1064,
      "EndLine": 1092,
      "Code": {
      "Lines": [
      {
      "Number": 1064,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1065,
      "Content": " - --health-probe-bind-address=:8081",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1066,
      "Content": " - --metrics-bind-address=127.0.0.1:8080",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1067,
      "Content": " - --leader-elect",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1068,
      "Content": " command:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1069,
      "Content": " - /manager",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1070,
      "Content": " image: projects.registry.vmware.com/cnsi/manager:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1071,
      "Content": " livenessProbe:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1072,
      "Content": " httpGet:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 1073,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV003",
      "AVDID": "AVD-KSV-0003",
      "Title": "Default capabilities not dropped",
      "Description": "The container should drop all default capabilities and add only those that are needed for its execution.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should add 'ALL' to 'securityContext.capabilities.drop'",
      "Namespace": "builtin.kubernetes.KSV003",
      "Query": "data.builtin.kubernetes.KSV003.deny",
      "Resolution": "Add 'ALL' to containers[].securityContext.capabilities.drop.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv003",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-capabilities-drop-index-all/",
      "https://avd.aquasec.com/misconfig/ksv003"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV003",
      "AVDID": "AVD-KSV-0003",
      "Title": "Default capabilities not dropped",
      "Description": "The container should drop all default capabilities and add only those that are needed for its execution.",
      "Message": "Container 'manager' of Deployment 'cnsi-controller-manager' should add 'ALL' to 'securityContext.capabilities.drop'",
      "Namespace": "builtin.kubernetes.KSV003",
      "Query": "data.builtin.kubernetes.KSV003.deny",
      "Resolution": "Add 'ALL' to containers[].securityContext.capabilities.drop.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv003",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-capabilities-drop-index-all/",
      "https://avd.aquasec.com/misconfig/ksv003"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1064,
      "EndLine": 1092,
      "Code": {
      "Lines": [
      {
      "Number": 1064,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1065,
      "Content": " - --health-probe-bind-address=:8081",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1066,
      "Content": " - --metrics-bind-address=127.0.0.1:8080",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1067,
      "Content": " - --leader-elect",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1068,
      "Content": " command:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1069,
      "Content": " - /manager",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1070,
      "Content": " image: projects.registry.vmware.com/cnsi/manager:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1071,
      "Content": " livenessProbe:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1072,
      "Content": " httpGet:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 1073,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV011",
      "AVDID": "AVD-KSV-0011",
      "Title": "CPU not limited",
      "Description": "Enforcing CPU limits prevents DoS via resource exhaustion.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should set 'resources.limits.cpu'",
      "Namespace": "builtin.kubernetes.KSV011",
      "Query": "data.builtin.kubernetes.KSV011.deny",
      "Resolution": "Set a limit value under 'containers[].resources.limits.cpu'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv011",
      "References": [
      "https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-resource-requests-and-limits",
      "https://avd.aquasec.com/misconfig/ksv011"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV014",
      "AVDID": "AVD-KSV-0014",
      "Title": "Root file system is not read-only",
      "Description": "An immutable root file system prevents applications from writing to their local disk. This can limit intrusions, as attackers will not be able to tamper with the file system or write foreign executables to disk.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should set 'securityContext.readOnlyRootFilesystem' to true",
      "Namespace": "builtin.kubernetes.KSV014",
      "Query": "data.builtin.kubernetes.KSV014.deny",
      "Resolution": "Change 'containers[].securityContext.readOnlyRootFilesystem' to 'true'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv014",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-readonlyrootfilesystem-true/",
      "https://avd.aquasec.com/misconfig/ksv014"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV014",
      "AVDID": "AVD-KSV-0014",
      "Title": "Root file system is not read-only",
      "Description": "An immutable root file system prevents applications from writing to their local disk. This can limit intrusions, as attackers will not be able to tamper with the file system or write foreign executables to disk.",
      "Message": "Container 'manager' of Deployment 'cnsi-controller-manager' should set 'securityContext.readOnlyRootFilesystem' to true",
      "Namespace": "builtin.kubernetes.KSV014",
      "Query": "data.builtin.kubernetes.KSV014.deny",
      "Resolution": "Change 'containers[].securityContext.readOnlyRootFilesystem' to 'true'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv014",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-readonlyrootfilesystem-true/",
      "https://avd.aquasec.com/misconfig/ksv014"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1064,
      "EndLine": 1092,
      "Code": {
      "Lines": [
      {
      "Number": 1064,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1065,
      "Content": " - --health-probe-bind-address=:8081",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1066,
      "Content": " - --metrics-bind-address=127.0.0.1:8080",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1067,
      "Content": " - --leader-elect",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1068,
      "Content": " command:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1069,
      "Content": " - /manager",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1070,
      "Content": " image: projects.registry.vmware.com/cnsi/manager:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1071,
      "Content": " livenessProbe:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1072,
      "Content": " httpGet:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 1073,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV015",
      "AVDID": "AVD-KSV-0015",
      "Title": "CPU requests not specified",
      "Description": "When containers have resource requests specified, the scheduler can make better decisions about which nodes to place pods on, and how to deal with resource contention.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should set 'resources.requests.cpu'",
      "Namespace": "builtin.kubernetes.KSV015",
      "Query": "data.builtin.kubernetes.KSV015.deny",
      "Resolution": "Set 'containers[].resources.requests.cpu'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv015",
      "References": [
      "https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-resource-requests-and-limits",
      "https://avd.aquasec.com/misconfig/ksv015"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV016",
      "AVDID": "AVD-KSV-0016",
      "Title": "Memory requests not specified",
      "Description": "When containers have memory requests specified, the scheduler can make better decisions about which nodes to place pods on, and how to deal with resource contention.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should set 'resources.requests.memory'",
      "Namespace": "builtin.kubernetes.KSV016",
      "Query": "data.builtin.kubernetes.KSV016.deny",
      "Resolution": "Set 'containers[].resources.requests.memory'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv016",
      "References": [
      "https://kubesec.io/basics/containers-resources-limits-memory/",
      "https://avd.aquasec.com/misconfig/ksv016"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV018",
      "AVDID": "AVD-KSV-0018",
      "Title": "Memory not limited",
      "Description": "Enforcing memory limits prevents DoS via resource exhaustion.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should set 'resources.limits.memory'",
      "Namespace": "builtin.kubernetes.KSV018",
      "Query": "data.builtin.kubernetes.KSV018.deny",
      "Resolution": "Set a limit value under 'containers[].resources.limits.memory'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv018",
      "References": [
      "https://kubesec.io/basics/containers-resources-limits-memory/",
      "https://avd.aquasec.com/misconfig/ksv018"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV020",
      "AVDID": "AVD-KSV-0020",
      "Title": "Runs with low user ID",
      "Description": "Force the container to run with user ID \u003e 10000 to avoid conflicts with the host’s user table.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should set 'securityContext.runAsUser' \u003e 10000",
      "Namespace": "builtin.kubernetes.KSV020",
      "Query": "data.builtin.kubernetes.KSV020.deny",
      "Resolution": "Set 'containers[].securityContext.runAsUser' to an integer \u003e 10000.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv020",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-runasuser/",
      "https://avd.aquasec.com/misconfig/ksv020"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV020",
      "AVDID": "AVD-KSV-0020",
      "Title": "Runs with low user ID",
      "Description": "Force the container to run with user ID \u003e 10000 to avoid conflicts with the host’s user table.",
      "Message": "Container 'manager' of Deployment 'cnsi-controller-manager' should set 'securityContext.runAsUser' \u003e 10000",
      "Namespace": "builtin.kubernetes.KSV020",
      "Query": "data.builtin.kubernetes.KSV020.deny",
      "Resolution": "Set 'containers[].securityContext.runAsUser' to an integer \u003e 10000.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv020",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-runasuser/",
      "https://avd.aquasec.com/misconfig/ksv020"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1064,
      "EndLine": 1092,
      "Code": {
      "Lines": [
      {
      "Number": 1064,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1065,
      "Content": " - --health-probe-bind-address=:8081",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1066,
      "Content": " - --metrics-bind-address=127.0.0.1:8080",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1067,
      "Content": " - --leader-elect",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1068,
      "Content": " command:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1069,
      "Content": " - /manager",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1070,
      "Content": " image: projects.registry.vmware.com/cnsi/manager:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1071,
      "Content": " livenessProbe:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1072,
      "Content": " httpGet:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 1073,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV021",
      "AVDID": "AVD-KSV-0021",
      "Title": "Runs with low group ID",
      "Description": "Force the container to run with group ID \u003e 10000 to avoid conflicts with the host’s user table.",
      "Message": "Container 'kube-rbac-proxy' of Deployment 'cnsi-controller-manager' should set 'securityContext.runAsGroup' \u003e 10000",
      "Namespace": "builtin.kubernetes.KSV021",
      "Query": "data.builtin.kubernetes.KSV021.deny",
      "Resolution": "Set 'containers[].securityContext.runAsGroup' to an integer \u003e 10000.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv021",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-runasuser/",
      "https://avd.aquasec.com/misconfig/ksv021"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV021",
      "AVDID": "AVD-KSV-0021",
      "Title": "Runs with low group ID",
      "Description": "Force the container to run with group ID \u003e 10000 to avoid conflicts with the host’s user table.",
      "Message": "Container 'manager' of Deployment 'cnsi-controller-manager' should set 'securityContext.runAsGroup' \u003e 10000",
      "Namespace": "builtin.kubernetes.KSV021",
      "Query": "data.builtin.kubernetes.KSV021.deny",
      "Resolution": "Set 'containers[].securityContext.runAsGroup' to an integer \u003e 10000.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv021",
      "References": [
      "https://kubesec.io/basics/containers-securitycontext-runasuser/",
      "https://avd.aquasec.com/misconfig/ksv021"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1064,
      "EndLine": 1092,
      "Code": {
      "Lines": [
      {
      "Number": 1064,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1065,
      "Content": " - --health-probe-bind-address=:8081",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1066,
      "Content": " - --metrics-bind-address=127.0.0.1:8080",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1067,
      "Content": " - --leader-elect",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1068,
      "Content": " command:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1069,
      "Content": " - /manager",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1070,
      "Content": " image: projects.registry.vmware.com/cnsi/manager:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1071,
      "Content": " livenessProbe:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1072,
      "Content": " httpGet:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 1073,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV030",
      "AVDID": "AVD-KSV-0030",
      "Title": "Default Seccomp profile not set",
      "Description": "The RuntimeDefault/Localhost seccomp profile must be required, or allow specific additional profiles.",
      "Message": "Either Pod or Container should set 'securityContext.seccompProfile.type' to 'RuntimeDefault'",
      "Namespace": "builtin.kubernetes.KSV030",
      "Query": "data.builtin.kubernetes.KSV030.deny",
      "Resolution": "Set 'spec.securityContext.seccompProfile.type', 'spec.containers[*].securityContext.seccompProfile' and 'spec.initContainers[*].securityContext.seccompProfile' to 'RuntimeDefault' or undefined.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv030",
      "References": [
      "https://kubernetes.io/docs/concepts/security/pod-security-standards/#restricted",
      "https://avd.aquasec.com/misconfig/ksv030"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV030",
      "AVDID": "AVD-KSV-0030",
      "Title": "Default Seccomp profile not set",
      "Description": "The RuntimeDefault/Localhost seccomp profile must be required, or allow specific additional profiles.",
      "Message": "Either Pod or Container should set 'securityContext.seccompProfile.type' to 'RuntimeDefault'",
      "Namespace": "builtin.kubernetes.KSV030",
      "Query": "data.builtin.kubernetes.KSV030.deny",
      "Resolution": "Set 'spec.securityContext.seccompProfile.type', 'spec.containers[*].securityContext.seccompProfile' and 'spec.initContainers[*].securityContext.seccompProfile' to 'RuntimeDefault' or undefined.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv030",
      "References": [
      "https://kubernetes.io/docs/concepts/security/pod-security-standards/#restricted",
      "https://avd.aquasec.com/misconfig/ksv030"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1064,
      "EndLine": 1092,
      "Code": {
      "Lines": [
      {
      "Number": 1064,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1065,
      "Content": " - --health-probe-bind-address=:8081",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1066,
      "Content": " - --metrics-bind-address=127.0.0.1:8080",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1067,
      "Content": " - --leader-elect",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1068,
      "Content": " command:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1069,
      "Content": " - /manager",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1070,
      "Content": " image: projects.registry.vmware.com/cnsi/manager:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1071,
      "Content": " livenessProbe:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1072,
      "Content": " httpGet:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 1073,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV041",
      "AVDID": "AVD-KSV-0041",
      "Title": "Do not allow management of secrets",
      "Description": "Check whether role permits managing secrets",
      "Message": "Role permits management of secret(s)",
      "Namespace": "builtin.kubernetes.KSV041",
      "Query": "data.builtin.kubernetes.KSV041.deny",
      "Resolution": "Create a role which does not permit to manage secrets if not needed",
      "Severity": "CRITICAL",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv041",
      "References": [
      "https://kubernetes.io/docs/concepts/security/rbac-good-practices/",
      "https://avd.aquasec.com/misconfig/ksv041"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 735,
      "EndLine": 746,
      "Code": {
      "Lines": [
      {
      "Number": 735,
      "Content": "- apiGroups:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 736,
      "Content": " - \"\"",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 737,
      "Content": " resources:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 738,
      "Content": " - secrets",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 739,
      "Content": " verbs:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 740,
      "Content": " - create",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 741,
      "Content": " - delete",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 742,
      "Content": " - get",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 743,
      "Content": " - list",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 744,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV048",
      "AVDID": "AVD-KSV-0048",
      "Title": "Do not allow update/create of a malicious pod",
      "Description": "Check whether role permits update/create of a malicious pod",
      "Message": "Role permits create/update of a malicious pod",
      "Namespace": "builtin.kubernetes.KSV048",
      "Query": "data.builtin.kubernetes.KSV048.deny",
      "Resolution": "Create a role which does not permit update/create of a malicious pod",
      "Severity": "HIGH",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv048",
      "References": [
      "https://kubernetes.io/docs/concepts/security/rbac-good-practices/",
      "https://avd.aquasec.com/misconfig/ksv048"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 759,
      "EndLine": 770,
      "Code": {
      "Lines": [
      {
      "Number": 759,
      "Content": "- apiGroups:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 760,
      "Content": " - apps",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 761,
      "Content": " resources:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 762,
      "Content": " - daemonsets",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 763,
      "Content": " verbs:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 764,
      "Content": " - create",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 765,
      "Content": " - delete",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 766,
      "Content": " - get",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 767,
      "Content": " - list",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 768,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV048",
      "AVDID": "AVD-KSV-0048",
      "Title": "Do not allow update/create of a malicious pod",
      "Description": "Check whether role permits update/create of a malicious pod",
      "Message": "Role permits create/update of a malicious pod",
      "Namespace": "builtin.kubernetes.KSV048",
      "Query": "data.builtin.kubernetes.KSV048.deny",
      "Resolution": "Create a role which does not permit update/create of a malicious pod",
      "Severity": "HIGH",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv048",
      "References": [
      "https://kubernetes.io/docs/concepts/security/rbac-good-practices/",
      "https://avd.aquasec.com/misconfig/ksv048"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 778,
      "EndLine": 789,
      "Code": {
      "Lines": [
      {
      "Number": 778,
      "Content": "- apiGroups:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 779,
      "Content": " - apps",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 780,
      "Content": " resources:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 781,
      "Content": " - replicasets",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 782,
      "Content": " verbs:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 783,
      "Content": " - create",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 784,
      "Content": " - delete",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 785,
      "Content": " - get",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 786,
      "Content": " - list",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 787,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV048",
      "AVDID": "AVD-KSV-0048",
      "Title": "Do not allow update/create of a malicious pod",
      "Description": "Check whether role permits update/create of a malicious pod",
      "Message": "Role permits create/update of a malicious pod",
      "Namespace": "builtin.kubernetes.KSV048",
      "Query": "data.builtin.kubernetes.KSV048.deny",
      "Resolution": "Create a role which does not permit update/create of a malicious pod",
      "Severity": "HIGH",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv048",
      "References": [
      "https://kubernetes.io/docs/concepts/security/rbac-good-practices/",
      "https://avd.aquasec.com/misconfig/ksv048"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 790,
      "EndLine": 801,
      "Code": {
      "Lines": [
      {
      "Number": 790,
      "Content": "- apiGroups:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 791,
      "Content": " - batch",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 792,
      "Content": " resources:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 793,
      "Content": " - cronjobs",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 794,
      "Content": " verbs:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 795,
      "Content": " - create",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 796,
      "Content": " - delete",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 797,
      "Content": " - get",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 798,
      "Content": " - list",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 799,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV049",
      "AVDID": "AVD-KSV-0049",
      "Title": "Do not allow management of configmaps",
      "Description": "Some workloads leverage configmaps to store sensitive data or configuration parameters that affect runtime behavior that can be modified by an attacker or combined with another issue to potentially lead to compromise.",
      "Message": "Role 'cnsi-leader-election-role' should not have access to resource 'configmaps' for verbs [\"create\", \"update\", \"patch\", \"delete\", \"deletecollection\", \"impersonate\", \"*\"]",
      "Namespace": "builtin.kubernetes.KSV049",
      "Query": "data.builtin.kubernetes.KSV049.deny",
      "Resolution": "Remove write permission verbs for resource 'configmaps'",
      "Severity": "MEDIUM",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv049",
      "References": [
      "https://kubernetes.io/docs/concepts/security/rbac-good-practices/",
      "https://avd.aquasec.com/misconfig/ksv049"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 673,
      "EndLine": 684,
      "Code": {
      "Lines": [
      {
      "Number": 673,
      "Content": "- apiGroups:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 674,
      "Content": " - \"\"",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 675,
      "Content": " resources:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 676,
      "Content": " - configmaps",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 677,
      "Content": " verbs:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 678,
      "Content": " - get",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 679,
      "Content": " - list",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 680,
      "Content": " - watch",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 681,
      "Content": " - create",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 682,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV056",
      "AVDID": "AVD-KSV-0056",
      "Title": "Do not allow management of networking resources",
      "Description": "The ability to control which pods get service traffic directed to them allows for interception attacks. Controlling network policy allows for bypassing lateral movement restrictions.",
      "Message": "ClusterRole 'cnsi-manager-role' should not have access to resources [\"services\", \"endpoints\", \"endpointslices\", \"networkpolicies\", \"ingresses\"] for verbs [\"create\", \"update\", \"patch\", \"delete\", \"deletecollection\", \"impersonate\", \"*\"]",
      "Namespace": "builtin.kubernetes.KSV056",
      "Query": "data.builtin.kubernetes.KSV056.deny",
      "Resolution": "Networking resources are only allowed for verbs 'list', 'watch', 'get'",
      "Severity": "HIGH",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv056",
      "References": [
      "https://kubernetes.io/docs/concepts/security/rbac-good-practices/",
      "https://avd.aquasec.com/misconfig/ksv056"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 895,
      "EndLine": 906,
      "Code": {
      "Lines": [
      {
      "Number": 895,
      "Content": "- apiGroups:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 896,
      "Content": " - networking.k8s.io",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 897,
      "Content": " resources:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 898,
      "Content": " - networkpolicies",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 899,
      "Content": " verbs:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 900,
      "Content": " - create",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 901,
      "Content": " - delete",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 902,
      "Content": " - get",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 903,
      "Content": " - list",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 904,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV106",
      "AVDID": "AVD-KSV-0106",
      "Title": "Container capabilities must only include NET_BIND_SERVICE",
      "Description": "Containers must drop ALL capabilities, and are only permitted to add back the NET_BIND_SERVICE capability.",
      "Message": "container should drop all",
      "Namespace": "builtin.kubernetes.KSV106",
      "Query": "data.builtin.kubernetes.KSV106.deny",
      "Resolution": "Set 'spec.containers[*].securityContext.capabilities.drop' to 'ALL' and only add 'NET_BIND_SERVICE' to 'spec.containers[*].securityContext.capabilities.add'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv106",
      "References": [
      "https://kubernetes.io/docs/concepts/security/pod-security-standards/#restricted",
      "https://avd.aquasec.com/misconfig/ksv106"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1054,
      "EndLine": 1063,
      "Code": {
      "Lines": [
      {
      "Number": 1054,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1055,
      "Content": " - --secure-listen-address=0.0.0.0:8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1056,
      "Content": " - --upstream=http://127.0.0.1:8080/",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1057,
      "Content": " - --logtostderr=true",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1058,
      "Content": " - --v=10",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1059,
      "Content": " image: projects.registry.vmware.com/cnsi/kubebuilder/kube-rbac-proxy:v0.8.0",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1060,
      "Content": " name: kube-rbac-proxy",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1061,
      "Content": " ports:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1062,
      "Content": " - containerPort: 8443",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1063,
      "Content": " name: https",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      }
      ]
      }
      }
      },
      {
      "Type": "Kubernetes Security Check",
      "ID": "KSV106",
      "AVDID": "AVD-KSV-0106",
      "Title": "Container capabilities must only include NET_BIND_SERVICE",
      "Description": "Containers must drop ALL capabilities, and are only permitted to add back the NET_BIND_SERVICE capability.",
      "Message": "container should drop all",
      "Namespace": "builtin.kubernetes.KSV106",
      "Query": "data.builtin.kubernetes.KSV106.deny",
      "Resolution": "Set 'spec.containers[*].securityContext.capabilities.drop' to 'ALL' and only add 'NET_BIND_SERVICE' to 'spec.containers[*].securityContext.capabilities.add'.",
      "Severity": "LOW",
      "PrimaryURL": "https://avd.aquasec.com/misconfig/ksv106",
      "References": [
      "https://kubernetes.io/docs/concepts/security/pod-security-standards/#restricted",
      "https://avd.aquasec.com/misconfig/ksv106"
      ],
      "Status": "FAIL",
      "Layer": {
      "DiffID": "sha256:352d57a0dc9b19800c12c27e239d6405b98f920953520445003f8a674945264e"
      },
      "CauseMetadata": {
      "Provider": "Kubernetes",
      "Service": "general",
      "StartLine": 1064,
      "EndLine": 1092,
      "Code": {
      "Lines": [
      {
      "Number": 1064,
      "Content": " - args:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": true,
      "LastCause": false
      },
      {
      "Number": 1065,
      "Content": " - --health-probe-bind-address=:8081",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1066,
      "Content": " - --metrics-bind-address=127.0.0.1:8080",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1067,
      "Content": " - --leader-elect",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1068,
      "Content": " command:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1069,
      "Content": " - /manager",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1070,
      "Content": " image: projects.registry.vmware.com/cnsi/manager:0.3",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1071,
      "Content": " livenessProbe:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": false
      },
      {
      "Number": 1072,
      "Content": " httpGet:",
      "IsCause": true,
      "Annotation": "",
      "Truncated": false,
      "FirstCause": false,
      "LastCause": true
      },
      {
      "Number": 1073,
      "Content": "",
      "IsCause": false,
      "Annotation": "",
      "Truncated": true,
      "FirstCause": false,
      "LastCause": false
      }
      ]
      }
      }
      }
      ]
      },
      {
      "Target": "OS Packages",
      "Class": "license"
      },
      {
      "Target": "Loose File License(s)",
      "Class": "license-file"
      }
      ]
    },
  ]
  resultData: any[] = []
  resultName = ''
  pageMaxCount = 0
  showDetailFlag = false
  dgLoading = false
  echartsLoading = false
  isOder = false
  currentDetail!: any
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    let resizeLeft = 445
    var resize: any = document.getElementById("trivy-resize");
    var left: any = document.getElementById("trivy-left");
    var right: any = document.getElementById("trivy-right");
    var box: any = document.getElementById("trivy-box");
    console.log('init');
    resize.onmousedown = function (e: any) {
        var startX = e.clientX;          
        resize.left = resizeLeft;          
          document.onmousemove = function (e) {
            var endX = e.clientX;
            
            var moveLen = resize.left + (startX - endX);
                          if (moveLen < 445) moveLen = 445;
            if (moveLen > box.clientWidth-55) moveLen = box.clientWidth-55;


            resize.style.left = moveLen;
            resizeLeft = moveLen
            right.style.width = moveLen + "px";
            left.style.width = (box.clientWidth - moveLen - 5) + "px";
        }
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resize.releaseCapture && resize.releaseCapture();
        }
        resize.setCapture && resize.setCapture();
        return false;
    }
  }
  showDetail(detail: any) {
    this.showDetailFlag = true
    this.currentDetail = detail
    setTimeout(() => {
      this.trivyDetail.dataSourceHandle()
    },100);
  }

  hideDetai(event:any) {
    for (let index = 0; index < event.target.classList.length; index++) { 
      if (event.target.classList[index] === 'report-detai-bg' || event.target.classList[index]  === 'report-detai-left') {
        this.showDetailFlag = false
        continue;
      }      
    }
  }

  showResults(report: {Results: any[], ArtifactName: string} ) {
    this.resultData = report.Results
    this.resultName = report.ArtifactName;
  }

  createTimeSort() {}
  pageChange(event: any) {}
}
