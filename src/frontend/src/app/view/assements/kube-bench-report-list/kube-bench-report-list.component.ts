import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import * as echarts from 'echarts';
type EChartsOption = echarts.EChartsOption;
@Component({
  selector: 'app-kube-bench-report-list',
  templateUrl: './kube-bench-report-list.component.html',
  styleUrls: ['./kube-bench-report-list.component.less']
})
export class KubeBenchReportListComponent implements OnInit {
  myChart!: any
  echartsLoading = true
  kubeBenchReportList = [
    {
      "_index" : "cis_report",
      "_id" : "4",
      "_score" : 1.0,
      "_source" : {
        "id" : "4",
        "version" : "cis-1.23",
        "detected_version" : "1.24",
        "text" : "Worker Node Security Configuration",
        "node_type" : "node",
        "tests" : [
          {
            "section" : "4.1",
            "type" : "",
            "pass" : 2,
            "fail" : 6,
            "warn" : 2,
            "info" : 0,
            "desc" : "Worker Node Configuration Files",
            "results" : [
              {
                "test_number" : "4.1.1",
                "test_desc" : "Ensure that the kubelet service file permissions are set to 644 or more restrictive (Automated)",
                "audit" : "/bin/sh -c 'if test -e /etc/systemd/system/kubelet.service.d/10-kubeadm.conf; then stat -c permissions=%a /etc/systemd/system/kubelet.service.d/10-kubeadm.conf; fi' ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the below command (based on the file location on your system) on the each worker node.
For example, chmod 644 /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
`,
                "test_info" : [
                  `Run the below command (based on the file location on your system) on the each worker node.
For example, chmod 644 /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "'permissions' is present"
              },
              {
                "test_number" : "4.1.2",
                "test_desc" : "Ensure that the kubelet service file ownership is set to root:root (Automated)",
                "audit" : "/bin/sh -c 'if test -e /etc/systemd/system/kubelet.service.d/10-kubeadm.conf; then stat -c %U:%G /etc/systemd/system/kubelet.service.d/10-kubeadm.conf; fi' ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the below command (based on the file location on your system) on the each worker node.
For example,
chown root:root /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
`,
                "test_info" : [
                  `Run the below command (based on the file location on your system) on the each worker node.
For example,
chown root:root /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "'root:root' is present"
              },
              {
                "test_number" : "4.1.3",
                "test_desc" : "If proxy kubeconfig file exists ensure permissions are set to 644 or more restrictive (Manual)",
                "audit" : "/bin/sh -c 'if test -e /etc/kubernetes/proxy.conf; then stat -c permissions=%a /etc/kubernetes/proxy.conf; fi' ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the below command (based on the file location on your system) on the each worker node.
For example,
chmod 644 /etc/kubernetes/proxy.conf
`,
                "test_info" : [
                  `Run the below command (based on the file location on your system) on the each worker node.
For example,
chmod 644 /etc/kubernetes/proxy.conf
`
                ],
                "status" : "PASS",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "'permissions' is present OR '/etc/kubernetes/proxy.conf' is not present"
              },
              {
                "test_number" : "4.1.4",
                "test_desc" : "If proxy kubeconfig file exists ensure ownership is set to root:root (Manual)",
                "audit" : "/bin/sh -c 'if test -e /etc/kubernetes/proxy.conf; then stat -c %U:%G /etc/kubernetes/proxy.conf; fi' ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the below command (based on the file location on your system) on the each worker node.
For example, chown root:root /etc/kubernetes/proxy.conf
`,
                "test_info" : [
                  `Run the below command (based on the file location on your system) on the each worker node.
For example, chown root:root /etc/kubernetes/proxy.conf
`
                ],
                "status" : "PASS",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "'root:root' is present OR '/etc/kubernetes/proxy.conf' is not present"
              },
              {
                "test_number" : "4.1.5",
                "test_desc" : "Ensure that the --kubeconfig kubelet.conf file permissions are set to 644 or more restrictive (Automated)",
                "audit" : "/bin/sh -c 'if test -e /etc/kubernetes/kubelet.conf; then stat -c permissions=%a /etc/kubernetes/kubelet.conf; fi' ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the below command (based on the file location on your system) on the each worker node.
For example,
chmod 644 /etc/kubernetes/kubelet.conf
`,
                "test_info" : [
                  `Run the below command (based on the file location on your system) on the each worker node.
For example,
chmod 644 /etc/kubernetes/kubelet.conf
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "'permissions' is present"
              },
              {
                "test_number" : "4.1.6",
                "test_desc" : "Ensure that the --kubeconfig kubelet.conf file ownership is set to root:root (Automated)",
                "audit" : "/bin/sh -c 'if test -e /etc/kubernetes/kubelet.conf; then stat -c %U:%G /etc/kubernetes/kubelet.conf; fi' ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the below command (based on the file location on your system) on the each worker node.
For example,
chown root:root /etc/kubernetes/kubelet.conf
`,
                "test_info" : [
                  `Run the below command (based on the file location on your system) on the each worker node.
For example,
chown root:root /etc/kubernetes/kubelet.conf
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "'root:root' is present"
              },
              {
                "test_number" : "4.1.7",
                "test_desc" : "Ensure that the certificate authorities file permissions are set to 644 or more restrictive (Manual)",
                "audit" : `CAFILE=$(ps -ef | grep kubelet | grep -v apiserver | grep -- --client-ca-file= | awk -F '--client-ca-file=' '{print $2}' | awk '{print $1}')
if test -z $CAFILE; then CAFILE=/etc/kubernetes/pki/ca.crt; fi
if test -e $CAFILE; then stat -c permissions=%a $CAFILE; fi
`,
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the following command to modify the file permissions of the
--client-ca-file chmod 644 <filename>
`,
                "test_info" : [
                  `Run the following command to modify the file permissions of the
--client-ca-file chmod 644 <filename>
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "'permissions' is present"
              },
              {
                "test_number" : "4.1.8",
                "test_desc" : "Ensure that the client certificate authorities file ownership is set to root:root (Manual)",
                "audit" : `CAFILE=$(ps -ef | grep kubelet | grep -v apiserver | grep -- --client-ca-file= | awk -F '--client-ca-file=' '{print $2}' | awk '{print $1}')
if test -z $CAFILE; then CAFILE=/etc/kubernetes/pki/ca.crt; fi
if test -e $CAFILE; then stat -c %U:%G $CAFILE; fi
`,
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the following command to modify the ownership of the --client-ca-file.
chown root:root <filename>
`,
                "test_info" : [
                  `Run the following command to modify the ownership of the --client-ca-file.
chown root:root <filename>
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "'root:root' is present"
              },
              {
                "test_number" : "4.1.9",
                "test_desc" : "Ensure that the kubelet --config configuration file has permissions set to 644 or more restrictive (Automated)",
                "audit" : "/bin/sh -c 'if test -e /var/lib/kubelet/config.yaml; then stat -c permissions=%a /var/lib/kubelet/config.yaml; fi' ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the following command (using the config file location identified in the Audit step)
chmod 644 /var/lib/kubelet/config.yaml
`,
                "test_info" : [
                  `Run the following command (using the config file location identified in the Audit step)
chmod 644 /var/lib/kubelet/config.yaml
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "'permissions' is present"
              },
              {
                "test_number" : "4.1.10",
                "test_desc" : "Ensure that the kubelet --config configuration file ownership is set to root:root (Automated)",
                "audit" : "/bin/sh -c 'if test -e /var/lib/kubelet/config.yaml; then stat -c %U:%G /var/lib/kubelet/config.yaml; fi' ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Run the following command (using the config file location identified in the Audit step)
chown root:root /var/lib/kubelet/config.yaml
`,
                "test_info" : [
                  `Run the following command (using the config file location identified in the Audit step)
chown root:root /var/lib/kubelet/config.yaml
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "'root:root' is present"
              }
            ]
          },
          {
            "section" : "4.2",
            "type" : "",
            "pass" : 1,
            "fail" : 6,
            "warn" : 6,
            "info" : 0,
            "desc" : "Kubelet",
            "results" : [
              {
                "test_number" : "4.2.1",
                "test_desc" : "Ensure that the --anonymous-auth argument is set to false (Automated)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'authentication: anonymous: enabled' to
'false'.
If using executable arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
'--anonymous-auth=false'
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'authentication: anonymous: enabled' to
'false'.
If using executable arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
'--anonymous-auth=false'
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.2",
                "test_desc" : "Ensure that the --authorization-mode argument is not set to AlwaysAllow (Automated)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'authorization.mode' to Webhook. If
using executable arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_AUTHZ_ARGS variable.
--authorization-mode=Webhook
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'authorization.mode' to Webhook. If
using executable arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_AUTHZ_ARGS variable.
--authorization-mode=Webhook
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.3",
                "test_desc" : "Ensure that the --client-ca-file argument is set as appropriate (Automated)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'authentication.x509.clientCAFile' to
the location of the client CA file.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_AUTHZ_ARGS variable.
--client-ca-file=<path/to/client-ca-file>
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'authentication.x509.clientCAFile' to
the location of the client CA file.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_AUTHZ_ARGS variable.
--client-ca-file=<path/to/client-ca-file>
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.4",
                "test_desc" : "Ensure that the --read-only-port argument is set to 0 (Manual)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'readOnlyPort' to 0.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
--read-only-port=0
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'readOnlyPort' to 0.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
--read-only-port=0
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.5",
                "test_desc" : "Ensure that the --streaming-connection-idle-timeout argument is not set to 0 (Manual)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'streamingConnectionIdleTimeout' to a
value other than 0.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
--streaming-connection-idle-timeout=5m
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'streamingConnectionIdleTimeout' to a
value other than 0.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
--streaming-connection-idle-timeout=5m
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.6",
                "test_desc" : "Ensure that the --protect-kernel-defaults argument is set to true (Automated)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'protectKernelDefaults' to 'true'.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
--protect-kernel-defaults=true
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'protectKernelDefaults' to 'true'.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
--protect-kernel-defaults=true
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.7",
                "test_desc" : "Ensure that the --make-iptables-util-chains argument is set to true (Automated)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'makeIPTablesUtilChains' to 'true'.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
remove the --make-iptables-util-chains argument from the
KUBELET_SYSTEM_PODS_ARGS variable.
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'makeIPTablesUtilChains' to 'true'.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
remove the --make-iptables-util-chains argument from the
KUBELET_SYSTEM_PODS_ARGS variable.
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.8",
                "test_desc" : "Ensure that the --hostname-override argument is not set (Manual)",
                "audit" : "/bin/ps -fC $kubeletbin ",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "",
                "remediation" : `Edit the kubelet service file /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
on each worker node and remove the --hostname-override argument from the
KUBELET_SYSTEM_PODS_ARGS variable.
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `Edit the kubelet service file /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
on each worker node and remove the --hostname-override argument from the
KUBELET_SYSTEM_PODS_ARGS variable.
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "PASS",
                "actual_value" : `  UID   PID  PPID   C STIME   TTY           TIME CMD
504 80935 80934   0  4:45PM ttys000    0:01.10 -zsh
504  4169  4168   0 Tue04PM ttys001    0:02.95 -zsh
504 63486  4169   0 10:17PM ttys001    0:02.17 kubectl port-forward service/opensearch-cluster-master 9999:9200
504 75290 75288   0  4:25PM ttys002    0:02.07 -zsh
504 18649 55536   0 12:21PM ttys003    0:01.01 /Users/zsimon/.gvm/pkgsets/system/global/bin/dlv --listen=127.0.0.1:63360 --headless=true --api-version=2 --check-go-version=false --only-same-user=false exec /private/var/folders/m5/t500k4cn3t798db6n1_v9lwc0000gr/T/GoLand/___kubebench -- --policy inspectionpolicy-sample
504 18652 18649   0 12:21PM ttys003    0:00.20 /Library/Developer/CommandLineTools/Library/PrivateFrameworks/LLDB.framework/Versions/A/Resources/debugserver --stdin-path /dev/stdin --stdout-path /dev/stdout --stderr-path /dev/stderr --unmask-signals -F -R 127.0.0.1:63362 -- /private/var/folders/m5/t500k4cn3t798db6n1_v9lwc0000gr/T/GoLand/___kubebench --policy inspectionpolicy-sample
504 18653 18652   0 12:21PM ttys003    0:00.19 /private/var/folders/m5/t500k4cn3t798db6n1_v9lwc0000gr/T/GoLand/___kubebench --policy inspectionpolicy-sample
504 18729 18653   0 12:21PM ttys003    0:00.00 /bin/sh
504 63545 65463   0 10:18PM ttys004    0:02.23 kubectl port-forward deploy/opensearch-dashboard-opensearch-dashboards 9998:5601
504 65463 65461   0  3:59PM ttys004    0:00.85 -zsh`,
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "'--hostname-override' is not present"
              },
              {
                "test_number" : "4.2.9",
                "test_desc" : "Ensure that the --event-qps argument is set to 0 or a level which ensures appropriate event capture (Manual)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'eventRecordQPS' to an appropriate level.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'eventRecordQPS' to an appropriate level.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameter in KUBELET_SYSTEM_PODS_ARGS variable.
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.10",
                "test_desc" : "Ensure that the --tls-cert-file and --tls-private-key-file arguments are set as appropriate (Manual)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'tlsCertFile' to the location
of the certificate file to use to identify this Kubelet, and 'tlsPrivateKeyFile'
to the location of the corresponding private key file.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameters in KUBELET_CERTIFICATE_ARGS variable.
--tls-cert-file=<path/to/tls-certificate-file>
--tls-private-key-file=<path/to/tls-key-file>
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'tlsCertFile' to the location
of the certificate file to use to identify this Kubelet, and 'tlsPrivateKeyFile'
to the location of the corresponding private key file.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the below parameters in KUBELET_CERTIFICATE_ARGS variable.
--tls-cert-file=<path/to/tls-certificate-file>
--tls-private-key-file=<path/to/tls-key-file>
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.11",
                "test_desc" : "Ensure that the --rotate-certificates argument is not set to false (Automated)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to add the line 'rotateCertificates' to 'true' or
remove it altogether to use the default value.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
remove --rotate-certificates=false argument from the KUBELET_CERTIFICATE_ARGS
variable.
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to add the line 'rotateCertificates' to 'true' or
remove it altogether to use the default value.
If using command line arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
remove --rotate-certificates=false argument from the KUBELET_CERTIFICATE_ARGS
variable.
Based on your system, restart the kubelet service. For example,
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "FAIL",
                "actual_value" : "",
                "scored" : true,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.12",
                "test_desc" : "Verify that the RotateKubeletServerCertificate argument is set to true (Manual)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `Edit the kubelet service file /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
on each worker node and set the below parameter in KUBELET_CERTIFICATE_ARGS variable.
--feature-gates=RotateKubeletServerCertificate=true
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `Edit the kubelet service file /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
on each worker node and set the below parameter in KUBELET_CERTIFICATE_ARGS variable.
--feature-gates=RotateKubeletServerCertificate=true
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              },
              {
                "test_number" : "4.2.13",
                "test_desc" : "Ensure that the Kubelet only makes use of Strong Cryptographic Ciphers (Manual)",
                "audit" : "/bin/ps -fC $kubeletbin",
                "AuditEnv" : "",
                "AuditConfig" : "/bin/cat /var/lib/kubelet/config.yaml",
                "type" : "",
                "remediation" : `If using a Kubelet config file, edit the file to set 'TLSCipherSuites' to
TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_128_GCM_SHA256
or to a subset of these values.
If using executable arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the --tls-cipher-suites parameter as follows, or to a subset of these values.
--tls-cipher-suites=TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_128_GCM_SHA256
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service
`,
                "test_info" : [
                  `If using a Kubelet config file, edit the file to set 'TLSCipherSuites' to
TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_128_GCM_SHA256
or to a subset of these values.
If using executable arguments, edit the kubelet service file
/etc/systemd/system/kubelet.service.d/10-kubeadm.conf on each worker node and
set the --tls-cipher-suites parameter as follows, or to a subset of these values.
--tls-cipher-suites=TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_256_GCM_SHA384,TLS_RSA_WITH_AES_128_GCM_SHA256
Based on your system, restart the kubelet service. For example:
systemctl daemon-reload
systemctl restart kubelet.service
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : `failed to run: "/bin/cat /var/lib/kubelet/config.yaml", output: "cat: /var/lib/kubelet/config.yaml: No such file or directory\n", error: exit status 1`
              }
            ]
          }
        ],
        "total_pass" : 3,
        "total_fail" : 12,
        "total_warn" : 8,
        "total_info" : 0
      }
    },
    {
      "_index" : "cis_report",
      "_id" : "5",
      "_score" : 1.0,
      "_source" : {
        "id" : "5",
        "version" : "cis-1.23",
        "detected_version" : "1.24",
        "text" : "Kubernetes Policies",
        "node_type" : "policies",
        "tests" : [
          {
            "section" : "5.1",
            "type" : "",
            "pass" : 0,
            "fail" : 0,
            "warn" : 8,
            "info" : 0,
            "desc" : "RBAC and Service Accounts",
            "results" : [
              {
                "test_number" : "5.1.1",
                "test_desc" : "Ensure that the cluster-admin role is only used where required (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Identify all clusterrolebindings to the cluster-admin role. Check if they are used and
if they need this role or if they could use a role with fewer privileges.
Where possible, first bind users to a lower privileged role and then remove the
clusterrolebinding to the cluster-admin role :
kubectl delete clusterrolebinding [name]
`,
                "test_info" : [
                  `Identify all clusterrolebindings to the cluster-admin role. Check if they are used and
if they need this role or if they could use a role with fewer privileges.
Where possible, first bind users to a lower privileged role and then remove the
clusterrolebinding to the cluster-admin role :
kubectl delete clusterrolebinding [name]
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.1.2",
                "test_desc" : "Minimize access to secrets (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Where possible, remove get, list and watch access to Secret objects in the cluster.
`,
                "test_info" : [
                  `Where possible, remove get, list and watch access to Secret objects in the cluster.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.1.3",
                "test_desc" : "Minimize wildcard use in Roles and ClusterRoles (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Where possible replace any use of wildcards in clusterroles and roles with specific
objects or actions.
`,
                "test_info" : [
                  `Where possible replace any use of wildcards in clusterroles and roles with specific
objects or actions.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.1.4",
                "test_desc" : "Minimize access to create pods (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Where possible, remove create access to pod objects in the cluster.
`,
                "test_info" : [
                  `Where possible, remove create access to pod objects in the cluster.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.1.5",
                "test_desc" : "Ensure that default service accounts are not actively used. (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Create explicit service accounts wherever a Kubernetes workload requires specific access
to the Kubernetes API server.
Modify the configuration of each default service account to include this value
automountServiceAccountToken: false
`,
                "test_info" : [
                  `Create explicit service accounts wherever a Kubernetes workload requires specific access
to the Kubernetes API server.
Modify the configuration of each default service account to include this value
automountServiceAccountToken: false
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.1.6",
                "test_desc" : "Ensure that Service Account Tokens are only mounted where necessary (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Modify the definition of pods and service accounts which do not need to mount service
account tokens to disable it.
`,
                "test_info" : [
                  `Modify the definition of pods and service accounts which do not need to mount service
account tokens to disable it.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.1.7",
                "test_desc" : "Avoid use of system:masters group (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Remove the system:masters group from all users in the cluster.
`,
                "test_info" : [
                  `Remove the system:masters group from all users in the cluster.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.1.8",
                "test_desc" : "Limit use of the Bind, Impersonate and Escalate permissions in the Kubernetes cluster (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Where possible, remove the impersonate, bind and escalate rights from subjects.
`,
                "test_info" : [
                  `Where possible, remove the impersonate, bind and escalate rights from subjects.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              }
            ]
          },
          {
            "section" : "5.2",
            "type" : "",
            "pass" : 0,
            "fail" : 0,
            "warn" : 13,
            "info" : 0,
            "desc" : "Pod Security Standards",
            "results" : [
              {
                "test_number" : "5.2.1",
                "test_desc" : "Ensure that the cluster has at least one active policy control mechanism in place (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Ensure that either Pod Security Admission or an external policy control system is in place
for every namespace which contains user workloads.
`,
                "test_info" : [
                  `Ensure that either Pod Security Admission or an external policy control system is in place
for every namespace which contains user workloads.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.2",
                "test_desc" : "Minimize the admission of privileged containers (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of privileged containers.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of privileged containers.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.3",
                "test_desc" : "Minimize the admission of containers wishing to share the host process ID namespace (Automated)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of 'hostPID' containers.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of 'hostPID' containers.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.4",
                "test_desc" : "Minimize the admission of containers wishing to share the host IPC namespace (Automated)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of 'hostIPC' containers.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of 'hostIPC' containers.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.5",
                "test_desc" : "Minimize the admission of containers wishing to share the host network namespace (Automated)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of 'hostNetwork' containers.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of 'hostNetwork' containers.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.6",
                "test_desc" : "Minimize the admission of containers with allowPrivilegeEscalation (Automated)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers with '.spec.allowPrivilegeEscalation' set to 'true'.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers with '.spec.allowPrivilegeEscalation' set to 'true'.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.7",
                "test_desc" : "Minimize the admission of root containers (Automated)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Create a policy for each namespace in the cluster, ensuring that either 'MustRunAsNonRoot'
or 'MustRunAs' with the range of UIDs not including 0, is set.
`,
                "test_info" : [
                  `Create a policy for each namespace in the cluster, ensuring that either 'MustRunAsNonRoot'
or 'MustRunAs' with the range of UIDs not including 0, is set.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.8",
                "test_desc" : "Minimize the admission of containers with the NET_RAW capability (Automated)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers with the 'NET_RAW' capability.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers with the 'NET_RAW' capability.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.9",
                "test_desc" : "Minimize the admission of containers with added capabilities (Automated)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Ensure that 'allowedCapabilities' is not present in policies for the cluster unless
it is set to an empty array.
`,
                "test_info" : [
                  `Ensure that 'allowedCapabilities' is not present in policies for the cluster unless
it is set to an empty array.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.10",
                "test_desc" : "Minimize the admission of containers with capabilities assigned (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Review the use of capabilites in applications running on your cluster. Where a namespace
contains applicaions which do not require any Linux capabities to operate consider adding
a PSP which forbids the admission of containers which do not drop all capabilities.
`,
                "test_info" : [
                  `Review the use of capabilites in applications running on your cluster. Where a namespace
contains applicaions which do not require any Linux capabities to operate consider adding
a PSP which forbids the admission of containers which do not drop all capabilities.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.11",
                "test_desc" : "Minimize the admission of Windows HostProcess containers (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers that have '.securityContext.windowsOptions.hostProcess' set to 'true'.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers that have '.securityContext.windowsOptions.hostProcess' set to 'true'.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.12",
                "test_desc" : "Minimize the admission of HostPath volumes (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers with 'hostPath' volumes.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers with 'hostPath' volumes.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.2.13",
                "test_desc" : "Minimize the admission of containers which use HostPorts (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers which use 'hostPort' sections.
`,
                "test_info" : [
                  `Add policies to each namespace in the cluster which has user workloads to restrict the
admission of containers which use 'hostPort' sections.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              }
            ]
          },
          {
            "section" : "5.3",
            "type" : "",
            "pass" : 0,
            "fail" : 0,
            "warn" : 2,
            "info" : 0,
            "desc" : "Network Policies and CNI",
            "results" : [
              {
                "test_number" : "5.3.1",
                "test_desc" : "Ensure that the CNI in use supports NetworkPolicies (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `If the CNI plugin in use does not support network policies, consideration should be given to
making use of a different plugin, or finding an alternate mechanism for restricting traffic
in the Kubernetes cluster.
`,
                "test_info" : [
                  `If the CNI plugin in use does not support network policies, consideration should be given to
making use of a different plugin, or finding an alternate mechanism for restricting traffic
in the Kubernetes cluster.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.3.2",
                "test_desc" : "Ensure that all Namespaces have NetworkPolicies defined (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Follow the documentation and create NetworkPolicy objects as you need them.
`,
                "test_info" : [
                  `Follow the documentation and create NetworkPolicy objects as you need them.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              }
            ]
          },
          {
            "section" : "5.4",
            "type" : "",
            "pass" : 0,
            "fail" : 0,
            "warn" : 2,
            "info" : 0,
            "desc" : "Secrets Management",
            "results" : [
              {
                "test_number" : "5.4.1",
                "test_desc" : "Prefer using Secrets as files over Secrets as environment variables (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `If possible, rewrite application code to read Secrets from mounted secret files, rather than
from environment variables.
`,
                "test_info" : [
                  `If possible, rewrite application code to read Secrets from mounted secret files, rather than
from environment variables.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.4.2",
                "test_desc" : "Consider external secret storage (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Refer to the Secrets management options offered by your cloud provider or a third-party
secrets management solution.
`,
                "test_info" : [
                  `Refer to the Secrets management options offered by your cloud provider or a third-party
secrets management solution.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              }
            ]
          },
          {
            "section" : "5.5",
            "type" : "",
            "pass" : 0,
            "fail" : 0,
            "warn" : 1,
            "info" : 0,
            "desc" : "Extensible Admission Control",
            "results" : [
              {
                "test_number" : "5.5.1",
                "test_desc" : "Configure Image Provenance using ImagePolicyWebhook admission controller (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Follow the Kubernetes documentation and setup image provenance.
`,
                "test_info" : [
                  `Follow the Kubernetes documentation and setup image provenance.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              }
            ]
          },
          {
            "section" : "5.7",
            "type" : "",
            "pass" : 0,
            "fail" : 0,
            "warn" : 4,
            "info" : 0,
            "desc" : "General Policies",
            "results" : [
              {
                "test_number" : "5.7.1",
                "test_desc" : "Create administrative boundaries between resources using namespaces (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Follow the documentation and create namespaces for objects in your deployment as you need
them.
`,
                "test_info" : [
                  `Follow the documentation and create namespaces for objects in your deployment as you need
them.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.7.2",
                "test_desc" : "Ensure that the seccomp profile is set to docker/default in your Pod definitions (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Use 'securityContext' to enable the docker/default seccomp profile in your pod definitions.
An example is as below:
securityContext:
  seccompProfile:
    type: RuntimeDefault
`,
                "test_info" : [
                  `Use 'securityContext' to enable the docker/default seccomp profile in your pod definitions.
An example is as below:
securityContext:
  seccompProfile:
    type: RuntimeDefault
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.7.3",
                "test_desc" : "Apply SecurityContext to your Pods and Containers (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Follow the Kubernetes documentation and apply SecurityContexts to your Pods. For a
suggested list of SecurityContexts, you may refer to the CIS Security Benchmark for Docker
Containers.
`,
                "test_info" : [
                  `Follow the Kubernetes documentation and apply SecurityContexts to your Pods. For a
suggested list of SecurityContexts, you may refer to the CIS Security Benchmark for Docker
Containers.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              },
              {
                "test_number" : "5.7.4",
                "test_desc" : "The default namespace should not be used (Manual)",
                "audit" : "",
                "AuditEnv" : "",
                "AuditConfig" : "",
                "type" : "manual",
                "remediation" : `Ensure that namespaces are created to allow for appropriate segregation of Kubernetes
resources and that all new resources are created in a specific namespace.
`,
                "test_info" : [
                  `Ensure that namespaces are created to allow for appropriate segregation of Kubernetes
resources and that all new resources are created in a specific namespace.
`
                ],
                "status" : "WARN",
                "actual_value" : "",
                "scored" : false,
                "IsMultiple" : false,
                "expected_result" : "",
                "reason" : "Test marked as a manual test"
              }
            ]
          }
        ],
        "total_pass" : 0,
        "total_fail" : 0,
        "total_warn" : 30,
        "total_info" : 0
      }
    },
  ]
  constructor(
    private router: Router
  ) { }

  echartsOption!: EChartsOption
  ngOnInit(): void {
    this.echartsInit()

    setTimeout(() => {
      this.echartsOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        title: {
          text: 'Kube Bench Type Reports',
          textStyle: {
            color: '#fff'
          },
          left: '40%'
        },
        xAxis: {
          type: 'category',
          axisTick: {
            alignWithLabel: true
          },
          data: [
            {
              value: 'Mon',
              textStyle: {
                color: '#fff',
              }
            },
            {
              value: 'Tue',
              textStyle: {
                color: '#fff'
              }
            },
            {
              value: 'Wed',
              textStyle: {
                color: '#fff'
              }
            },
            {
              value: 'Thu',
              textStyle: {
                color: '#fff'
              }
            },
            {
              value: 'Fri',
              textStyle: {
                color: '#fff'
              }
            },
            {
              value: 'Sat',
              textStyle: {
                color: '#fff'
              }
            },
            {
              value: 'Sun',
              textStyle: {
                color: '#fff'
              }
            },
          ],
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            data: [
              {
                value: 12,
                itemStyle: {
                  color: '#5470C6'
                }
              },
              {
                value: 20,
                itemStyle: {
                  color: '#91CB74'
                }
              },
              {
                value: 27,
                itemStyle: {
                  color: '#FAC858'
                }
              },
              {
                value: 32,
                itemStyle: {
                  color: '#EE6666'
                }
              },
              {
                value: 42,
                itemStyle: {
                  color: '#72C0DE'
                }
              },
              {
                value: 17,
                itemStyle: {
                  color: '#3BA272'
                }
              },
              {
                value: 14,
                itemStyle: {
                  color: '#FC8451'
                }
              },
            ],
            type: 'bar',
            showBackground: true,
            color: [
              '#FC8451',
              '#9960B4',
              '#EA7CCC'
            ]
          }
        ]
      }
      this.myChart.clear()
      this.echartsOption && this.myChart.setOption(this.echartsOption);
      this.echartsLoading = false      
    }, 1500)
  }

  echartsInit() {
    const chartDom = document.getElementById('main')!;
    this.myChart = echarts.init(chartDom);
  }

  toKubeBenchReportTests(kube: any) {    
    sessionStorage.setItem(kube._id, JSON.stringify(kube))
    this.router.navigateByUrl(`assessments/kube-bench/test-view/${kube._id}`)
  }
}
