/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'

@Component({
  selector: 'app-workload-page',
  templateUrl: './workload-page.component.html',
  styleUrls: ['./workload-page.component.less']
})
export class WorkloadPageComponent implements OnInit {
  public pageSizeOptions = [10, 20, 50, 100, 500];
  constructor(
    public shardService:ShardService
  ) { }

  ngOnInit(): void {
  }

  toWorkload(item:{namespace:string, workload:any}) {
    this.shardService.showWorkloadDetailFlag = true
    this.shardService.navVariable = 'Workload'
    this.shardService.currentWorkload = item
    // this.resetWorkload('workloadDetailFlag')
  }

  showDetail(event:any) {
    for (let index = 0; index < event.target.classList.length; index++) {      
      if (event.target.classList[index] === 'report-detai-bg') {
        this.shardService.showWorkloadDetailFlag = false
        this.shardService.currentReport = null
        continue;
      }      
    }
  }
}
