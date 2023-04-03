import { Component, Input, OnInit } from '@angular/core';
import { echarts, BarSeriesOption } from 'src/app/shard/shard/echarts';
type ECOption = echarts.ComposeOption<BarSeriesOption>

@Component({
  selector: 'app-trivy-view-detail',
  templateUrl: './trivy-view-detail.component.html',
  styleUrls: ['./trivy-view-detail.component.less']
})
export class TrivyViewDetailComponent implements OnInit {

  @Input('detailInfo') detailInfo: any = {}
  myChart!: any
  echartsOption!: ECOption
  echartsLoading = true
  accordionPanel = true
  constructor() { }
  detailList: any[] = []
  ngOnInit(): void { 
    setTimeout(() => {
      this.echartsInit()
    }, 100);
  }

  // charts init
  echartsInit() {
    const chartDom = document.getElementById('misconfigurations-bar')!;
    this.myChart = echarts.init(chartDom);
  }

  // data init
  dataSourceHandle() {
    const xAxis = [
      'Successes',
      'Failures',
      'Exceptions'
    ]
    const series:{value: number, itemStyle: {[key:string]: string}}[] = [
      {
        value: this.detailInfo.MisconfSummary?.Successes || 0,
        itemStyle: {
          color: '#91CB74'
        }
      },
      {
        value: this.detailInfo?.MisconfSummary?.Failures || 0,
        itemStyle: {
          color: '#EE6666'
        }
      },
      {
        value: this.detailInfo?.MisconfSummary?.Exceptions || 0,
        itemStyle: {
          color: '#5470C6'
        }
      },
    ]

    this.echartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      title: {
        text: 'Misconfigurations Detection Result Distribution',
        textStyle: {
          color: '#fff'
        },
        left: '30%'
      },
      xAxis: {
        type: 'category',
        axisTick: {
          alignWithLabel: true
        },
        data: xAxis
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: series,
          type: 'bar',
          showBackground: true,
          color: [
            '#FC8451',
            '#9960B4',
            '#EA7CCC'
          ]
        }
      ]
    }
    this.myChart.clear()
    this.echartsLoading = false
    this.echartsOption && this.myChart.setOption(this.echartsOption);
  }

  showDetail(detail: any) {
    this.detailList = detail.Detail
  }

}
