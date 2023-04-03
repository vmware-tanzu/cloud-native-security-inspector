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
  public workloadInfo!:any
  showDetailFlag = false
  currentWordloadInfo!: any
  currentContainer!: any
  constructor(
    public shardService:ShardService,
    private assessmentService: AssessmentService
    ) { }

  ngOnInit(): void { 
  }

  showDetail(wd: any) {
    this.currentWordloadInfo = wd
    this.showDetailFlag = true
  }

  showContainerVAC(cn: any) {
    this.currentContainer = {
      "name":"nginx",
      "id":"nginx:1.14.2",
      "image":"docker-pullable://nginx@sha256:f7988fb6c02e0ce69257d9bd9cf37ae20a60f1df7563c3a2a6abe24160306b8d",
      "imageID":"docker://ee31b91a9cc20c1b5fc25a6e300050fd4d01f5ce33e6f4ac9dfff9dae0b6dd49",
      "isInit":true,
      "vac_product_meta":{
         "name":"apache",
         "branch":"2",
         "version":"2.4.55",
         "revision":"44",
         "released_at":"2023-03-03T00:59:52.762Z",
         "last_version_released":"2.4.55",
         "deprecation_policy":{
            "deprecation_date":"2022-12-14",
            "grace_period_days":30,
            "reason":"We will only maintain newest versions of Wordpress",
            "alternative":"Wordpress 7 can be used instead",
            "AdditionalProperties":null
         },
         "nonsupport_policy":{
            "name":"Memcached is not supported anymore",
            "reason":"Upstream project has been discontinued.",
            "AdditionalProperties":null
         },
         "status":"DEPRECATED",
         "AdditionalProperties":null,
         "trusted":true
      }
   }
  }
}
