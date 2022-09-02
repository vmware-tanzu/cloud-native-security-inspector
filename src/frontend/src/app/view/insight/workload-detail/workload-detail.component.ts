/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'

@Component({
  selector: 'app-workload-detail',
  templateUrl: './workload-detail.component.html',
  styleUrls: ['./workload-detail.component.less']
})
export class WorkloadDetailComponent implements OnInit {

  constructor(
    public shardService:ShardService
  ) { }

    ngOnInit(): void { }
}
