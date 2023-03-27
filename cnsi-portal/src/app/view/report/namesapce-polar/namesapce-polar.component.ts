import { Component, OnInit } from '@angular/core';
import { echarts, PieSeriesOption } from 'src/app/shard/shard/echarts';
type ECOption = echarts.ComposeOption<PieSeriesOption>

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
  chartOptions!:ECOption
  constructor() { }
  ngOnInit(): void {
    this.chartInit()
  }

  newReport() {
    this.chartOptions = {
      title: {
        text: '',
        subtext: '',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'horizontal',
        left: 'center',
        itemWidth: 50,
        textStyle: {
          color: "#ffffff"
        }
      },
      series: [
        {
          name: 'Workloads From',
          type: 'pie',
          radius: '50%',
          data: [
            { value: this.abnormal, name: 'Abnormal', itemStyle: {color: '#EE6666'}},
            { value: this.normal, name: 'Normal', itemStyle: {color: '#3BA272'} },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    this.myChart.clear()
    this.chartOptions && this.myChart.setOption(this.chartOptions);
  }

  getSeries (normal=0, abnormal=0):any {
  this.normal = normal
  this.abnormal = abnormal
  this.newReport()    
  }

  chartInit() {
    const canvas = document.getElementById('namespace-pie') as HTMLDivElement;
    this.myChart = echarts.init(canvas);
  }

}
