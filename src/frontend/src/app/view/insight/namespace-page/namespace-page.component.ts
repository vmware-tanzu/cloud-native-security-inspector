/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
    private router:Router

  ) { }

  ngOnInit(): void {
    if (!this.shardService.currentNamespaceInfo) {
      this.shardService.currentNamespaceInfo = this.shardService.namespaceList[0]
    }
    this.setNamespaceHistogramChart()
    const data = {
      normal: this.shardService.showNormal,
      abnormal: this.shardService.showAbnormal,
      compliant: this.shardService.showCompliant,
    }  
    this.packedbubbleRender(data)  
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
