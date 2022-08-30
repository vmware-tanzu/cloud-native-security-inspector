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

@Component({
  selector: 'app-cluster-page',
  templateUrl: './cluster-page.component.html',
  styleUrls: ['./cluster-page.component.less']
})
export class ClusterPageComponent implements OnInit {
  @ViewChild('packedbubble')packedbubble!: PackedbubbleComponent
  @ViewChild('reportline')reportline!: LineComponent
  public summary = true
  public violations = false
  public pageSizeOptions = [10, 20, 50, 100, 500];
  timer:any
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
    this.shardService.updateFlag = false
    if (obj) {
      this.shardService.workloadChartbarOption.series[0].data = []
      obj.workloads.workloads.forEach(workload => {
        this.shardService.workloadChartbarOption.series[0].data.push(workload.workloadList.length)
      });
      this.shardService.updateFlag = true
    }    
    this.violations = value
  }
  constructor(
    public shardService:ShardService,
    private router:Router,
    private policyService:PolicyService
  ) { }

  ngOnInit(): void {
    this.policyService.getAssessmentreports().subscribe(
      data => {
          const newData = {
            normal: this.shardService.allNormal,
            abnormal: this.shardService.allAbnormal,
            compliant: this.shardService.allCompliant,
          }
          this.packedbubbleRender(newData)
      }
    )
    this.timer = setInterval(() => {
      if (this.shardService.reportLineChartOption.series[0].data.length > 0) {
        clearInterval(this.timer)
      }
      if (this.reportline) {
        this.reportline.render()
      }
    },100) 
  }

  packedbubbleRender(data:{normal:number, abnormal:number, compliant:number}) {
    this.timer = setInterval(() => {
      if (this.packedbubble) {
        this.packedbubble.getSeries(data.normal, data.abnormal, data.compliant)
        clearInterval(this.timer)
      }
    }, 100);
  }
  toWorkload(item:{namespace:string, workload:any}) {
    this.shardService.currentWorkload = item
    this.shardService.showWorkloadDetailFlag = true
    this.router.navigate(['/insight/workload'])
  }
}
