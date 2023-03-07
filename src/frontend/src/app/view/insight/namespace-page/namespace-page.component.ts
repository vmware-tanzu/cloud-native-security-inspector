/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardService } from 'src/app/service/shard.service'
import { PackedbubbleComponent } from 'src/app/view/report/packedbubble/packedbubble.component'
import { NamesapceHistogramComponent } from '../../report/namesapce-histogram/namesapce-histogram.component';

@Component({
  selector: 'app-namespace-page',
  templateUrl: './namespace-page.component.html',
  styleUrls: ['./namespace-page.component.less']
})
export class NamespacePageComponent implements OnInit {
  @ViewChild('namespaceHistogram')namespaceHistogram!: NamesapceHistogramComponent
  @ViewChild('packedbubble')packedbubble!: PackedbubbleComponent
  public summary = true
  public violations = false
  public pageSizeOptions = [10, 20, 50, 100, 500];
  public timer!:any
  get summaryFlag () {
    return this.summary
  }

  set summaryFlag (value) {
    if (value) {
      const data = {
        normal: this.shardService.showNormal,
        abnormal: this.shardService.showAbnormal,
        compliant: this.shardService.showCompliant,
      }
      this.packedbubbleRender(data)
      this.summary = value

    } else {
      this.summary = value
    }
  }

  get violationsFlag () {
    return this.violations
  }


  set violationsFlag (value) {
    const obj = this.shardService.namespaceList.find(el => el.name === this.shardService.namespaceDefault)
    if (obj) {
      this.shardService.workloadChartbarOption.series[0].data = []
      this.shardService.workloadChartbarOption.xAxis = []
      obj.workloads.workloads.forEach(workload => {
        this.shardService.workloadChartbarOption.xAxis.push(workload.name)
        this.shardService.workloadChartbarOption.series[0].data.push(workload.violationList.length)
      });
    }    
    setTimeout(() => {      
      if (this.namespaceHistogram) {
        this.namespaceHistogram.render()
      }
    });
    this.violations = value
  }
  constructor(
    public shardService:ShardService,
    private assessmentService: AssessmentService,
    private router:Router

  ) { }

  ngOnInit(): void {
    this.setNamespaceHistogramChart()
    this.getNewReport()
  }

  getNewReport() {  
    this.shardService.currentNamespaceInfo = this.shardService.namespaceList[0]  
    const opensearchbase: any = localStorage.getItem('cnsi-open-search')
    const opensearchInfoJson = window.atob(opensearchbase)
    if (!opensearchInfoJson.slice(24)) {
      return
    } else {
      const opensearchInfo = JSON.parse(opensearchInfoJson.slice(24))   
      const client = 'opensearch'
      if (opensearchInfo.url) {
        this.assessmentService.getKubeBenchReport({url: opensearchInfo.url, index: 'insight_report', username: opensearchInfo.user, password: opensearchInfo.pswd, query: {
          size: 1,
          from: 0,
          "query": {
            "match_all": {}
          }
        }, client, ca: ''}).subscribe(
          data => {
            this.shardService.namespacChartLineOption.xAxis = []
            this.shardService.namespacChartLineOption.series[0].data = []
            this.shardService.scanTime = data.hits.hits[0]._source.timeStamp

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
              this.shardService.namespacChartLineOption.xAxis.push(el.name)
              this.shardService.namespacChartLineOption.series[0].data.push(0)


            })

            data.hits.hits.forEach((el: any) => {

              if (workloadNamespance[el._source.namespaceAssessments[0].namespace.name]) {
                const index = this.shardService.namespacChartLineOption.xAxis.findIndex((ns: string)=> ns === el._source.namespaceAssessments[0].namespace.name)
                this.shardService.namespacChartLineOption.series[0].data[index] = el._source.namespaceAssessments[0].workloadAssessments.reduce((n:number, wk: any) => {
                  if (wk.passed !== true) {
                    return n+=1
                  } else {
                    return n
                  }
                }, 0)
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

            this.shardService.namespaceList.forEach(el => {
              el.workloads = workloadNamespance[el.name]
            })
          },
          err => {}
        )
      }
    }

  }

  packedbubbleRender(data:{normal:number, abnormal:number, compliant:number}) {
    setTimeout(() => {
      this.packedbubble?.getSeries(data.normal, data.abnormal)
    });
  }

  setNamespaceHistogramChart (){
    this.timer = setInterval(() => {
      if (this.shardService.workloadChartbarOption.series[0].data.length > 0) {
        if (this.namespaceHistogram) {
          this.namespaceHistogram.render()
          clearInterval(this.timer)
        }
      }
    },100) 
  }

  toWorkload(item:{namespace:string, workload:any}) {
    this.shardService.currentWorkload = item
    this.shardService.showWorkloadDetailFlag = true
    this.router.navigate(['/insight/workload'])
  }
}
