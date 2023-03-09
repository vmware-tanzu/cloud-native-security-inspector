/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service';

@Component({
  selector: 'app-namespace',
  templateUrl: './namespace.component.html',
  styleUrls: ['./namespace.component.less']
})
export class NamespaceComponent implements OnInit {
  @Input('all') all = false
  @Output() packedbubbleRender = new EventEmitter()
  @Output() setNamespaceHistogramChart = new EventEmitter()
  public namespace:any = {}
  public provider = 'Tanzu Kubernetes Grid'
  constructor(
    public shardService: ShardService,
    private policyService: PolicyService
  ) { }

  ngOnInit(): void { }
  switchNamespace (value:string) {
    const obj = this.shardService.namespaceList.find(el => el.name === value)
    this.shardService.currentNamespaceviolationList = obj?.workloads.violationList
    if (this.all) {
      if (obj) {
        this.shardService.workloadChartbarOption.series[0].data = []
        obj.workloads.workloads.forEach(workload => {
          this.shardService.workloadChartbarOption.series[0].data.push(workload.violationList.length)
        });
        this.shardService.showNormal = obj.workloads.normal,
        this.shardService.showAbnormal = obj.workloads.abnormal,
        this.shardService.showCompliant = obj.workloads.compliant
        this.setNamespaceHistogramChart.emit()
      }
    } else {
      if (obj) {
        this.shardService.currentNamespaceInfo = obj
        this.shardService.showNormal = obj.workloads.normal,
        this.shardService.showAbnormal = obj.workloads.abnormal,
        this.shardService.showCompliant = obj.workloads.compliant
        const namespaceData = {
          normal: this.shardService.showNormal,
          abnormal: this.shardService.showAbnormal,
          compliant: this.shardService.showCompliant,
        }
      
        this.packedbubbleRender.emit(namespaceData)
      }
    }
  }
}
