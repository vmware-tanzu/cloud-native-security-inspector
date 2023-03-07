/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { PackedbubbleComponent } from 'src/app/view/report/packedbubble/packedbubble.component'
import { LineComponent } from '../../report/line/line.component';
import { HistogramComponent } from '../../report/histogram/histogram.component';
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle
} from 'chart.js';
import { AssessmentService } from 'src/app/service/assessment.service';

Chart.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle
);

@Component({
  selector: 'app-cluster-page',
  templateUrl: './cluster-page.component.html',
  styleUrls: ['./cluster-page.component.less']
})
export class ClusterPageComponent implements OnInit {
  @ViewChild('packedbubble')
  packedbubble!: PackedbubbleComponent;
  @ViewChild('reportline2')
  reportline!: LineComponent
  @ViewChild('histogram')
  histogram!: HistogramComponent
  public summary = true
  public violations = false
  public pageSizeOptions = [10, 20, 50, 100, 500];
  timer:any
  timer2:any
  get summaryFlag () {
    return this.summary
  }

  set summaryFlag (value) {
    if (value) {
      const data = {
        normal: this.shardService.allNormal,
        abnormal: this.shardService.allAbnormal,
        compliant: this.shardService.allCompliant,
      }    
      // this.packedbubbleRender(data)
      setTimeout(() => {
        if (this.packedbubble) {
          this.packedbubble.getSeries(data.normal, data.abnormal)
        }
      });
      // this.lineRender()
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
    setTimeout(() => {
      if (this.histogram) {
        this.histogram.render()
      }
    });   
    this.violations = value
  }
  constructor(
    public shardService:ShardService,
    private router:Router,
    private assessmentService:AssessmentService
  ) { }

  ngOnInit(): void {
    this.getNewReport()
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
          size: 1,
          from: 0,
          "query": {
            "match_all": {}
          }
        }, client, ca: ''}).subscribe(
          data => {
            this.shardService.scanTime = data.hits.hits[0]._source.timeStamp
            this.shardService.namespacChartLineOption.xAxis = []
            this.shardService.namespacChartLineOption.series[0].data = []

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

            this.shardService.allWorkloadList = []
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

            this.shardService.allNormal = 0
            this.shardService.allAbnormal = 0
            this.shardService.namespaceList.forEach(el => {
              el.workloads = workloadNamespance[el.name]
              this.shardService.allNormal += workloadNamespance[el.name].normal
              this.shardService.allAbnormal += workloadNamespance[el.name].abnormal
            })
            this.packedbubble.getSeries(this.shardService.allNormal, this.shardService.allAbnormal)    
          },
          err => {}
        )
      }
    }

  }

  toWorkload(item:{namespace:string, workload:any}) {
    this.shardService.currentWorkload = item
    this.shardService.showWorkloadDetailFlag = true
    this.router.navigate(['/insight/workload'])
  }

}
