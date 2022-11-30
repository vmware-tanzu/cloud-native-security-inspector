/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardService } from 'src/app/service/shard.service'

@Component({
  selector: 'app-report-view-detail',
  templateUrl: './report-view-detail.component.html',
  styleUrls: ['./report-view-detail.component.less']
})
export class ReportViewDetailComponent implements OnInit {
  public pageSizeOptions = [10, 20, 50, 100, 500];
  public currentReport:any = {}
  public workloadInfo!:any
  constructor(
    public shardService:ShardService,
    private assessmentService: AssessmentService
    ) { }

  ngOnInit(): void { }
  setCurrentReport(data:any) {    
    this.currentReport = data
  }

  getRisk(workload: any) {
    this.workloadInfo = workload


    const opensearchbase: any = localStorage.getItem('cnsi-open-search')
    // const elasticsearchbase: any = localStorage.getItem('cnsi-elastic-search')
    const opensearchInfoJson = window.atob(opensearchbase)
    // const elasticsearchInfoJson = window.atob(elasticsearchbase)

    const opensearchInfo = JSON.parse(opensearchInfoJson.slice(24))   
    // const elasticsearchInfo = JSON.parse(elasticsearchInfoJson.slice(24))  
    let searchInfoa: any ={}
    let client = ''
    let ca = ''
    if (opensearchInfo) {
      if (opensearchInfo.url) {
        client = 'risk_opensearch'
        searchInfoa = opensearchInfo
      } else {
        // searchInfoa = elasticsearchInfo
        // client = 'elasticsearch'
        // ca = elasticsearchInfo.ca
      }

      if (this.workloadInfo.workload.pods.length > 0) {
        this.workloadInfo.workload.pods.forEach((pod: any) => {
          this.assessmentService.getKubeBenchReport({url: searchInfoa.url, index: 'risk_manager_details', username: searchInfoa.user, password: searchInfoa.pswd, query: pod.metadata.uid, client, ca}).subscribe(
            data => {
              if (data._source.Detail) {
                pod.detail = data._source.Detail
              } else {
                pod.detail = {}
              }
            },
            err => {}
          )
        });
      }
    }    
  }
}
