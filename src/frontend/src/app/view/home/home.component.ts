/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'
import { PolicyService } from 'src/app/service/policy.service'
import * as moment from 'moment';
 @Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {  
  constructor(
    public shardService: ShardService,
    private policyService: PolicyService
    ) {
  }
  ngOnInit(): void {
    this.getAssessmentreports()
    setInterval(() => {
      this.getAssessmentreports()
    }, 60000)
    this.shardService.getApiservice().subscribe()
    this.getSummaryInfo()
  }

  getAssessmentreports() {
    this.policyService.getAllAssessmentreports().subscribe(
      data => {
        data.items = data.items.splice(data.items.length - 10)
        this.shardService.namespacChartLineOption.xAxis = []
        this.shardService.namespacChartLineOption.series[0].data = []
        this.shardService.clusterChartBarOptions.series[0] = [{
          name: 'Number of Workloads',
          color: 'skyblue',
          data: []
        }]
        const workloadNamespance:any = {}
        this.shardService.clusterChartBarOptions.xAxis = []
        this.shardService.namespaceList.forEach(el => {
          // get namespaces report xAxis data
          this.shardService.namespacChartLineOption.xAxis.push(el.name)
          this.shardService.clusterChartBarOptions.xAxis.push(el.name)
          this.shardService.namespacChartLineOption.series[0].data.push(0)
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
            // compliant: 0
          }
        })
        // Convert creationTimestamp to timestamp
        data.items.forEach(el => {
          el.metadata.creationTimestamp = moment(el.metadata.creationTimestamp).valueOf()
        })
        // sort
        const reportslist = data.items.sort(this.compare())        
        // get new report
        this.shardService.newReport = reportslist[reportslist.length -1]
        // get new report scan time stamp
        this.shardService.scanTime = reportslist[reportslist.length-1]?.metadata.creationTimestamp        
        //
        this.shardService.violationList = []
        this.shardService.newReport?.spec.namespaceAssessments.forEach(el => {
          const index = this.shardService.namespacChartLineOption.xAxis.findIndex((ns: string)=> ns === el.namespace.name)
          this.shardService.namespacChartLineOption.series[0].data[index] = el.workloadAssessments.reduce((n, wk) => {
            if (wk.passed !== true) {
              return n+=1
            } else {
              return n
            }
          }, 0)
          if (workloadNamespance[el.namespace.name]) {
            el.workloadAssessments.forEach(workload => {
              const newWorkload = {
                workload:workload.workload,
                passed: workload.passed,
                failures: workload.failures
              }
              workloadNamespance[el.namespace.name].workloads.forEach((work:{name:string, workloadList:any[]}) => {
                if(work.name === workload.workload.metadata.kind) work.workloadList.push(newWorkload)
              });
              if (workload.passed) {
                workloadNamespance[el.namespace.name].normal++
              } else {
                workloadNamespance[el.namespace.name].abnormal++
                if (workload.failures && workload.failures.length > 0) {
                  workloadNamespance[el.namespace.name].violationList.push({
                    workload
                  })
                  if(workload.workload.metadata.kind)
                  workloadNamespance[el.namespace.name].workloads.forEach((work:any) => {
                    if (work.name === workload.workload.metadata.kind) work.violationList.push(workload)
                  });
                }
              }
            });
            //
          }
          this.shardService.allWorkloadList = []
          el.workloadAssessments.forEach(workload => {
            this.shardService.allWorkloadList.push({
              namespace: el.namespace.name,
              workload: workload
            })
            if(!workload.passed && workload.failures && workload.failures.length > 0) {
              this.shardService.violationList.push({
                namespace: el.namespace.name,
                workload: workload
              })

            }
          });

        })
        this.shardService.allNormal = 0
        this.shardService.allAbnormal = 0
        // this.shardService.allCompliant = 0
        this.shardService.clusterNamespaceWorkloadAmount = []
        this.shardService.namespaceList.forEach(el => {
          this.shardService.clusterNamespaceWorkloadAmount.push(
            // workloadNamespance[el.name].normal+ workloadNamespance[el.name].compliant + workloadNamespance[el.name].abnormal
            workloadNamespance[el.name].normal+ workloadNamespance[el.name].abnormal
          )
          el.workloads = workloadNamespance[el.name]
          this.shardService.namespacChartLineOption.series[0].data.push(workloadNamespance[el.name].abnormal)     
          this.shardService.allNormal += workloadNamespance[el.name].normal
          // this.shardService.allCompliant += workloadNamespance[el.name].compliant
          this.shardService.allAbnormal += workloadNamespance[el.name].abnormal
        })
        this.shardService.clusterChartBarOptions.series[0].data = this.shardService.clusterNamespaceWorkloadAmount      

        this.shardService.currentNamespaceInfo = this.shardService.namespaceList[0]
        this.shardService.namespaceDefault = this.shardService.currentNamespaceInfo?.name    
        this.shardService.currentNamespaceviolationList = this.shardService.namespaceList[0]?.workloads.violationList
        //
        const lineDate:string[] = []
        const abnormalLineData:number[] = []
        const normal:number[] = []
        const abnormal:number[] = []
        const sumworkload:number[] = []
        reportslist.forEach(el => {
          el.metadata.creationTimestamp = moment(el.metadata.creationTimestamp).format('LLL')
          lineDate.push(el.metadata.creationTimestamp)
          let abCount = 0
          let normalCount = 0
          let abnormalCount = 0
          let sumworkloadCount = 0          
          el.spec.namespaceAssessments.forEach(namespace => {
            namespace.workloadAssessments.forEach(workload => {
              if (workload.failures) {
                abCount+=workload.failures.length
              }
              if (workload.passed) {
                normalCount++;
                sumworkloadCount++;
              } else {
                sumworkloadCount++;
                abnormalCount++
              }
            });
          })

          abnormalLineData.push(abCount)
          normal.push(normalCount)
          abnormal.push(abnormalCount)
          sumworkload.push(sumworkloadCount)
        })
        const newsumworkload = JSON.parse(JSON.stringify(sumworkload))        
        const lineDate1 = JSON.parse(JSON.stringify(lineDate))        
        const lineDate2 = JSON.parse(JSON.stringify(lineDate))        

        this.shardService.reportLineChartOption.xAxis = lineDate1.splice(lineDate.length-9, lineDate.length)
        this.shardService.clusterLineChartOption.xAxis = lineDate2.splice(lineDate.length-9, lineDate.length)
        this.shardService.reportLineChartOption.series = abnormalLineData.splice(abnormalLineData.length-9, abnormalLineData.length)
        this.shardService.clusterLineChartOption.series[0].data = normal.splice(normal.length-10, normal.length)
        this.shardService.clusterLineChartOption.series[1].data = abnormal.splice(abnormal.length-10, abnormal.length)
        this.shardService.clusterLineChartOption.series[2].data = sumworkload.splice(sumworkload.length-10, sumworkload.length)
        // this.shardService.reportslist = reportslist  
      },
      err => {
        console.log('err', err);
      }
    )
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