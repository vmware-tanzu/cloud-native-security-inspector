/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShardService } from 'src/app/service/shard.service'
import { LineComponent } from '../../report/line/line.component';
import { ReportViewDetailComponent } from '../report-view-detail/report-view-detail.component'
@Component({
  selector: 'app-report-view',
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.less']
})
export class ReportViewComponent implements OnInit, OnDestroy {
  @ViewChild('reportline')reportline!: LineComponent|null
  @ViewChild('reportDetail')reportDetail!:ReportViewDetailComponent
  @ViewChild('pagination') pagination!:any
  public pageSizeOptions = [10, 20, 50, 100, 500];
  public showDetailFlag = false
  private timer:any
  constructor(
    public shardService:ShardService,
    public router:Router
  ) { }

  ngOnInit(): void {
    this.timer = setInterval(() => {
      if (this.shardService.reportLineChartOption.series[0].data.length > 0) {
        clearInterval(this.timer)
      }
      if (this.reportline) {
        this.reportline.render()        
      }
    },100)    
  }

  ngOnDestroy(): void {}
    
  toReport(report: any) {
    this.showDetailFlag = true
    // this.shardService.navVariable = 'Cluster'
    const annotations:{key:string, value:string}[] = []
    const labels:{key:string, value:string}[] = []
    for (const key in report.metadata.annotations) {
      annotations.push({
        key,
        value: report.metadata.annotations[key]
      })
    }
    report.metadata.annotations = annotations
    if (report.spec.inspectionConfiguration.namespaceSelector) {
      for (const key in report.spec.inspectionConfiguration.namespaceSelector.matchLabels) {
        labels.push({
          key,
          value: report.spec.inspectionConfiguration.namespaceSelector.matchLabels[key]
        })
      }
      report.spec.inspectionConfiguration.namespaceSelector.matchLabels = labels
    }
    this.shardService.currentReport = report
    this.reportDetail.currentReport = report.spec.namespaceAssessments[0]
    // this.resetWorkload('reportDetailFlag')
  }

  sizeChange(size: any) {
    
  }
  pageChange(page: any) {
    
  }

  showDetail(event:any) {

    for (let index = 0; index < event.target.classList.length; index++) {      
      if (event.target.classList[index] === 'report-detai-bg') {
        this.showDetailFlag = false
        this.shardService.currentReport = null
        continue;
      }      
    }
  }
}
