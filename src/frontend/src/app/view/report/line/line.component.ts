/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.less']
})
export class LineComponent implements OnInit {
  @Input('chartOptions')chartOptions!:any
  @Input('updateFlag')updateFlag!:any
  @ViewChild('charts')charts!:any
  constructor() { }

  ngOnInit(): void {
  }
  Highcharts: typeof Highcharts = Highcharts;
  render ():any {
    this.updateFlag = true
  }
}
