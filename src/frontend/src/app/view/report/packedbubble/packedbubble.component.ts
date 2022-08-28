/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, Input, OnInit } from '@angular/core';
import * as Highcharts from "highcharts";
import HC_more from "highcharts/highcharts-more";
HC_more(Highcharts);
interface ExtendedChart extends Highcharts.PlotPackedbubbleOptions {
  layoutAlgorithm: {
    splitSeries: any;
  };
}
@Component({
  selector: 'app-packedbubble',
  templateUrl: './packedbubble.component.html',
  styleUrls: ['./packedbubble.component.less']
})
export class PackedbubbleComponent implements OnInit {
  normal = 0
  abnormal = 0
  compliant = 0
  chart:any
  Highcharts: any;
  constructor() { }
  ngOnInit() {
    this.bubbleChartActive()
  }

   bubbleChartActive() {
     this.chart =Highcharts.chart({
       chart: {
         renderTo: "container",
         type: "packedbubble",
         height: "400px",
         backgroundColor: '#22343C'
       },
       title: {
         text: "",
         style: {
           color: '#fff'
         }
       },
       tooltip: {
         useHTML: true,
         pointFormat: "<b>{point.name}:</b> {point.value}"
       },
       plotOptions: {
         packedbubble: {
           minSize: "30%",
           maxSize: "100%",
           zMin: 0,
           zMax: 1000,
           layoutAlgorithm: {
             gravitationalConstant: 0.05,
             splitSeries: true,
             seriesInteraction: false,
             dragBetweenSeries: true,
             parentNodeLimit: true
           },
           dataLabels: {
             enabled: true,
             format: "{point.name}",
             style: {
               color: "black",
               textOutline: "none",
               fontWeight: "normal"
             }
           }
         } as ExtendedChart
       },
       series: [{
        type: "packedbubble",
        name: '',
        data: [
          {
            name: "Abnormal",
            value: this.abnormal,
            color: 'red'
          },
          {
            name: "normal",
            value: this.normal,
            color: 'green'
          },
          // {
          //   name: "Compliant",
          //     value: this.compliant,
          //     color: 'yellow'
          //   }
          ]
      }]
     });
   }

   getSeries (normal=0, abnormal=0, compliant=0):any {
    this.normal = normal
    this.abnormal = abnormal
    this.compliant = compliant
    const a:any = document.getElementById('container')
    a.innerHTML = ''
    this.bubbleChartActive()
   }
}
