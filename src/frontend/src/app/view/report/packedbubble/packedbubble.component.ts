/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, Input, OnInit } from '@angular/core';
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
  selector: 'app-packedbubble',
  templateUrl: './packedbubble.component.html',
  styleUrls: ['./packedbubble.component.less']
})
export class PackedbubbleComponent implements OnInit {
  normal = 0
  abnormal = 0
  compliant = 0
  myChart:any
  constructor() { }
  ngOnInit(): void {
    this.newReport('polarArea')
  }
  newReport(DomID: string) {
    const canvas: HTMLCanvasElement = document.getElementById(DomID) as HTMLCanvasElement;
    const ctx: any = canvas.getContext('2d');
    this.myChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
          labels: [
            'Abnormal',
            "Normal"
          ],
          datasets: [
            {
              label: '',
              data: [0, 0],
              backgroundColor: [
                '#EE6666',
                '#3BA272'
              ]
            }
          ]
      },
      options: {
          responsive: false,
          scales: {
          },
      }
    });    
  }

   getSeries (normal=0, abnormal=0, compliant=0):any {
    this.normal = normal
    this.abnormal = abnormal
    this.compliant = compliant    
    this.myChart.data.datasets[0].data = [this.abnormal, this.normal]
    this.myChart.update()    
   }
}
