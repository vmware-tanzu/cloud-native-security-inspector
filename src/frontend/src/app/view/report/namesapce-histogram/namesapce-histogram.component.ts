
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
  selector: 'app-namesapce-histogram',
  templateUrl: './namesapce-histogram.component.html',
  styleUrls: ['./namesapce-histogram.component.less']
})
export class NamesapceHistogramComponent implements OnInit {
  @Input('chartOptions') chartOptions!:any
  @Input('updateFlag') updateFlag:boolean = false
  @Input('width') width:string = '100%'
  @Input('height') height:string = '400px'
  @ViewChild('charts')charts!:any
  public myChart: any;
  constructor() {
  }
  ngOnInit() {
    this.newReport('namespace-bar')
  }
  render ():any {
    setTimeout(() => {
      this.myChart.data.datasets = this.chartOptions.series
      this.myChart.data.labels = this.chartOptions.xAxis 
      this.myChart.update()
    });
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
          }          },
      }
    });    
  }

}
