/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'
import { PolicyService } from 'src/app/service/policy.service'
import * as moment from 'moment';
import { AssessmentService } from 'src/app/service/assessment.service';
 @Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {  
  constructor(
    public shardService: ShardService,
    private assessmentService: AssessmentService
    ) {
  }
  ngOnInit(): void {
    this.shardService.getApiservice().subscribe()
    this.getSummaryInfo()
  }

  getNewReport() {    
    const opensearchbase: any = localStorage.getItem('cnsi-open-search')
    const opensearchInfoJson = window.atob(opensearchbase)
    if (!opensearchInfoJson.slice(24)) {
      return
    } else {
      const opensearchInfo = JSON.parse(opensearchInfoJson.slice(24))   
      const client = 'opensearch'
      if (opensearchInfo.url) {
        this.assessmentService.getKubeBenchReport({url: opensearchInfo.url, index: 'insight_report', username: opensearchInfo.user, password: opensearchInfo.pswd, query: {
          "query": {
            "match_all": {}
          }
        }, client, ca: ''}).subscribe(
          data => {
            const workloadNamespance: any = {}
            this.shardService.namespaceList.forEach(el => {
              // get namespaces report xAxis data
              workloadNamespance[el.name] = {
                workloads: [
                  {
                    name: 'Deployment',
                    workloadList: [],
                    violationList: []
                  },
                  {
                    name: 'ReplicaSet',
                    workloadList: [],
                    violationList: []
                  },
                  {
                    name: 'StatefulSet',
                    workloadList: [],
                    violationList: []
                  },
                  {
                    name: 'DaemonSet',
                    workloadList: [],
                    violationList: []
                  },
                  {
                    name: 'CronJob',
                    workloadList: [],
                    violationList: []
                  },
                  {
                    name: 'Job',
                    workloadList: [],
                    violationList: []
                  },
                  {
                    name: 'Pod',
                    workloadList: [],
                    violationList: []
                  },
                  
                ],
                violationList: [],
                normal: 0,
                abnormal: 0,
              }
            })

            data.hits.hits.forEach((el: any) => {

              if (workloadNamespance[el._source.namespaceAssessments[0].namespace.name]) {
                el._source.namespaceAssessments[0].workloadAssessments.forEach((workload: any) => {
                  const newWorkload = {
                    workload:workload.workload,
                    passed: workload.passed,
                    failures: workload.failures
                  }

                  workloadNamespance[el._source.namespaceAssessments[0].namespace.name].workloads.forEach((work:{name:string, workloadList:any[]}) => {
                    if(work.name === workload.workload.metadata.kind) work.workloadList.push(newWorkload)
                  });
                  if (workload.passed) {
                    workloadNamespance[el._source.namespaceAssessments[0].namespace.name].normal++
                  } else {
                    workloadNamespance[el._source.namespaceAssessments[0].namespace.name].abnormal++
                    if (workload.failures && workload.failures.length > 0) {
                      workloadNamespance[el._source.namespaceAssessments[0].namespace.name].violationList.push({
                        workload
                      })
                      if(workload.workload.metadata.kind)
                      workloadNamespance[el._source.namespaceAssessments[0].namespace.name].workloads.forEach((work:any) => {
                        if (work.name === workload.workload.metadata.kind) work.violationList.push(workload)
                      });
                    }
                  }
                });
              }
              this.shardService.allWorkloadList = []
              el._source.namespaceAssessments[0].workloadAssessments.forEach((workload: any) => {
                this.shardService.allWorkloadList.push({
                  namespace: el._source.namespaceAssessments[0].namespace.name,
                  workload: workload
                })
                if(!workload.passed && workload.failures && workload.failures.length > 0) {
                  this.shardService.violationList.push({
                    namespace: el._source.namespaceAssessments[0].namespace.name,
                    workload: workload
                  })

                }
              });

            })

          },
          err => {}
        )
      }
    }

  }
  compare(){
    return function(m:any,n:any){
        var a = m.metadata.creationTimestamp;
        var b = n.metadata.creationTimestamp;
        return a - b;
    }
  }

  getSummaryInfo() {
    this.shardService.getNodeList().subscribe(
      (data:any) => {
        this.shardService.nodesInfo.list = data.items
        this.shardService.nodesInfo.version = data.items[0].status.nodeInfo.kubeletVersion
        this.shardService.nodesInfo.cpu = {
          capacity: 0,
          allocatable: 0
        }
        this.shardService.nodesInfo.memory= {
          capacity: 0,
          allocatable: 0
        }
        data.items.forEach((item:any) => {
          this.shardService.nodesInfo.cpu.capacity +=Number(item.status.capacity.cpu)
          this.shardService.nodesInfo.cpu.allocatable +=Number(item.status.allocatable.cpu)
          this.shardService.nodesInfo.memory.capacity +=parseInt(item.status.capacity.memory)
          this.shardService.nodesInfo.memory.allocatable +=parseInt(item.status.allocatable.memory)
        });
      }
    )
  }
}