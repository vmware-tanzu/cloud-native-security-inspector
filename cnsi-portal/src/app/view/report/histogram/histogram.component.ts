/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, Input, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle
} from 'chart.js';

Chart.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  SubTitle
);

@Component({
  selector: 'app-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.less']
})
export class HistogramComponent implements OnInit {
  @Input('chartOptions') chartOptions:any
  @Input('updateFlag') updateFlag:boolean = false
  @Input('width') width:string = '100%'
  @Input('height') height:string = '400px'
  @ViewChild('charts')charts:any
  public myChart: any;
  constructor() {
  }
  ngOnInit() {
    this.newReport('bar')
  }
  render ():any {    
    this.myChart.data.datasets = this.chartOptions.series
    this.myChart.data.labels = this.chartOptions.xAxis 
    console.log('this.myChart', this.myChart);
    
    this.myChart.update()
  }

  newReport(DomID: string) {
    const canvas: HTMLCanvasElement = document.getElementById(DomID) as HTMLCanvasElement;
    const ctx: any = canvas.getContext('2d');
    this.myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: [],
          datasets: []
      },
      options: {
          responsive: false,
          onResize: (chart, style) => {
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#fff',
                stepSize: 1
              }
            },
          x: {
            ticks: {
              color: '#fff'
            }
          }          
        },
      }
    });    
  }
}
