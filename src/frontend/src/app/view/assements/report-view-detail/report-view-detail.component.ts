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

  ngOnInit(): void { 
  }
  setCurrentReport(data:any) {    
    this.currentReport = data
  }
}
