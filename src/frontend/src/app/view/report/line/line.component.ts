/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, Input, OnInit, ViewChild } from '@angular/core';
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
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.less']
})
export class LineComponent implements OnInit {
  @Input('chartOptions')chartOptions!:any
  @Input('updateFlag')updateFlag!:any
  @ViewChild('charts')charts!:any
  constructor() { }
  public myChart: any;
  ngOnInit(): void {
    this.newReport('line')
  }
  render ():any {
    this.myChart.data.datasets = this.chartOptions.series
    this.myChart.data.labels = this.chartOptions.xAxis 
    this.myChart.update()
  }

  newReport(DomID: string) {
    const canvas: HTMLCanvasElement = document.getElementById(DomID) as HTMLCanvasElement;
    const ctx: any = canvas.getContext('2d');
    this.myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: [],
          datasets: []
      },
      options: {
          responsive: false,
          onResize: (chart, style) => {
            console.log(chart);
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#fff'
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
