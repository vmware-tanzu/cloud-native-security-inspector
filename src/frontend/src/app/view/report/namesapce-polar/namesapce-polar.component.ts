import { Component, OnInit } from '@angular/core';
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
  selector: 'app-namesapce-polar',
  templateUrl: './namesapce-polar.component.html',
  styleUrls: ['./namesapce-polar.component.less']
})
export class NamesapcePolarComponent implements OnInit {

  normal = 0
  abnormal = 0
  compliant = 0
  myChart:any
  constructor() { }
  ngOnInit(): void {
    this.newReport('namespace-polarArea')
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
                'rgb(255, 99, 132)',
                'rgb(75, 192, 192)',
                'rgb(255, 205, 86)',
                'rgb(201, 203, 207)',
                'rgb(54, 162, 235)'
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
