/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, Input, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import * as Highcharts from "highcharts";
import * as moment from 'moment'
@Component({
  selector: 'app-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.less']
})
export class HistogramComponent implements OnInit {
  @Input('chartOptions') chartOptions!:any
  @Input('updateFlag') updateFlag:boolean = false
  @Input('width') width:string = '100%'
  @Input('height') height:string = '400px'
  @ViewChild('charts')charts!:any
  constructor() {
  }
  ngOnInit() {
  }
  Highcharts: typeof Highcharts = Highcharts;
  render ():any {
    this.updateFlag = true
  }
}
