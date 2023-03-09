/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'
import { PolicyService } from 'src/app/service/policy.service'
import * as moment from 'moment';
import { AssessmentService } from 'src/app/service/assessment.service';
 @Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {  
  constructor(
    public shardService: ShardService,
    private assessmentService: AssessmentService
    ) {
  }
  ngOnInit(): void {
    this.shardService.getApiservice().subscribe()
    this.getSummaryInfo()
  }

  getSummaryInfo() {
    this.shardService.getNodeList().subscribe(
      (data:any) => {
        this.shardService.nodesInfo.list = data.items
        this.shardService.nodesInfo.version = data.items[0].status.nodeInfo.kubeletVersion
        this.shardService.nodesInfo.cpu = {
          capacity: 0,
          allocatable: 0
        }
        this.shardService.nodesInfo.memory= {
          capacity: 0,
          allocatable: 0
        }
        data.items.forEach((item:any) => {
          this.shardService.nodesInfo.cpu.capacity +=Number(item.status.capacity.cpu)
          this.shardService.nodesInfo.cpu.allocatable +=Number(item.status.allocatable.cpu)
          this.shardService.nodesInfo.memory.capacity +=parseInt(item.status.capacity.memory)
          this.shardService.nodesInfo.memory.allocatable +=parseInt(item.status.allocatable.memory)
        });
      }
    )
  }
}