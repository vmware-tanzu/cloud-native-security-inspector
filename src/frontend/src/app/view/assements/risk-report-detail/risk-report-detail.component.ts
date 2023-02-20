import { Component, OnInit, Input } from '@angular/core';
import { echarts, BarSeriesOption } from 'src/app/shard/shard/echarts';
type ECOption = echarts.ComposeOption<BarSeriesOption>


@Component({
  selector: 'app-risk-report-detail',
  templateUrl: './risk-report-detail.component.html',
  styleUrls: ['./risk-report-detail.component.less']
})
export class RiskReportDetailComponent implements OnInit {
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
    const chartDom = document.getElementById('pod-list')!;
    this.myChart = echarts.init(chartDom);
  }

  // data init
  dataSourceHandle() {
    const xAxis: {value: string, textStyle: {[key:string]: string}}[] = []
    const series:{value: number, itemStyle: {[key:string]: string}}[] = []

    const color = ['#5470C6', '#91CB74', '#FAC858', '#EE6666', '#72C0DE', '#3BA272', '#FC8451', "#c1232b",
    "#27727b",
    "#fcce10",
    "#e87c25",
    "#b5c334",
    "#fe8463",
    "#9bca63",
    "#fad860",
    "#f3a43b",
    "#60c0dd",
    "#d7504b",
    "#c6e579",
    "#f4e001",
    "#f0805a",
    "#26c0c0"]
    this.detailInfo._source && this.detailInfo._source.ReportDetail && this.detailInfo._source.ReportDetail.forEach((tp: {Detail: any[], name: string}, index: number) => {
      // Display up to 100 items
      if (xAxis.length < 101) {
        xAxis.push({
          value: tp.name,
          textStyle: {
            color: '#fff',
          }
        })
        series.push(
          {
            value: tp.Detail.length,
            itemStyle: {
              color: color[index] ? color[index] : '#566FC6'
            }
          },
        )
      }
    });
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
        text: 'Number of Risks in Workloads',
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
