/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardService } from 'src/app/service/shard.service'
import { PolicyService } from 'src/app/service/policy.service'

@Component({
  selector: 'app-report-view-detail',
  templateUrl: './report-view-detail.component.html',
  styleUrls: ['./report-view-detail.component.less']
})
export class ReportViewDetailComponent implements OnInit {
  public pageSizeOptions = [10, 20, 50, 100, 500];
  public workloadInfo!:any
  public showTrustedColumn = false
  showDetailFlag = false
  currentWordloadInfo!: any
  currentContainer!: any
  constructor(
    public shardService:ShardService,
    private policyService: PolicyService
    ) { }

  ngOnInit(): void {
    this.policyService.getInspectionpolicies().subscribe(
      data => {
        if (data.items[0]) {          
          const policy = data.items[0]
          this.showTrustedColumn = policy.spec.vacAssessmentEnabled
        } else {
          this.showTrustedColumn = false
        }
      },
      err => {
        this.showTrustedColumn = false
      }
    )
  }

  showDetail(wd: any) {
    this.currentContainer = null
    this.currentWordloadInfo = wd
    this.showDetailFlag = true
  }

  showContainerVAC(cn: any) {
    this.currentContainer = cn
  }
}
