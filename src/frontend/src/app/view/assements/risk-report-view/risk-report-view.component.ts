import { Component, OnInit, ViewChild } from '@angular/core';
import { AssessmentService } from 'src/app/service/assessment.service';
import { echarts, LineSeriesOption } from 'src/app/shard/shard/echarts';
type ECOption = echarts.ComposeOption<LineSeriesOption>


@Component({
  selector: 'app-risk-report-view',
  templateUrl: './risk-report-view.component.html',
  styleUrls: ['./risk-report-view.component.less']
})
export class RiskReportViewComponent implements OnInit {
  @ViewChild('pagination') pagination:any
  echartsOption!: ECOption
  myChart!: any
  opensearchInfo!: {url: string, user: string, pswd: string}
  currentDetail: any = {}
  defaultSize = 10
  from = 0
  pageMaxCount = 1
  dgLoading = false
  public showDetailFlag = false

  riskList = []
  constructor(
    private assessmentService: AssessmentService
  ) { }

  ngOnInit(): void {
    this.echartsInit()
    const query: any = { 
      size:  this.defaultSize,
      from: 0
    };
    this.getRiskList(query, this.riskCallBack)

  }
  // init
  echartsInit() {
    const chartDom = document.getElementById('risk')!;
    this.myChart = echarts.init(chartDom);
  }
  // echarts render 
  echartsRender(dateList: any, valueList: any) {
    this.echartsOption = {
      // Make gradient line here
      visualMap: [
        {
          show: false,
          type: 'continuous',
          seriesIndex: 0,
          min: 0,
          max: 200000
        }
      ],
    
      title: [
        {
          left: 'center',
          text: 'number of vulnerabilities',
          textStyle: {
            color: '#fff'
          }
        }
      ],
      tooltip: {
        trigger: 'axis'
      },
      xAxis: [
        {
          data: dateList
        }
      ],
      yAxis: [
        {}
      ],
      grid: [
        {}
      ],
      series: [
        {
          type: 'line',
          showSymbol: false,
          data: valueList
        }
      ]
    }

    this.myChart.clear()
    this.echartsOption && this.myChart.setOption(this.echartsOption);
  }

  // get risk list
  getRiskList(query: any, callback: Function) {
    this.dgLoading = true
    const opensearchbase: any = localStorage.getItem('cnsi-open-search')
    // const elasticsearchbase: any = localStorage.getItem('cnsi-elastic-search')
    const opensearchInfoJson = window.atob(opensearchbase)
    // const elasticsearchInfoJson = window.atob(elasticsearchbase)

    const opensearchInfo = JSON.parse(opensearchInfoJson.slice(24))   
    // const elasticsearchInfo = JSON.parse(elasticsearchInfoJson.slice(24))  
    const client = 'opensearch'
    let ca = ''
    if (opensearchInfo.url) {
      this.opensearchInfo = opensearchInfo
      this.assessmentService.getKubeBenchReport({url: this.opensearchInfo.url, index: 'risk_manager_details', username: this.opensearchInfo.user, password: this.opensearchInfo.pswd, query, client, ca}).subscribe(
        data => {
          callback(data, this)
          // data.hits.total.value
          this.pageMaxCount = Math.ceil( 100 / this.defaultSize)
        },
        err => {}
      )
    } else {
      this.dgLoading = false
    }

  }

  // risk callback
  riskCallBack(data: any, that: any) {
    const dateList: any = []
    const valueList: any = []
    data.hits.hits.forEach((el: any) => {
      if (el._source.uid) {
        el.risk_number = el._source.Detail.length
        that.riskList.push(el)
        dateList.push(el._source.createTime)
        valueList.push(el.risk_number)
        that.echartsRender(dateList, valueList)
      }
    });
    console.log('dateList', valueList, dateList);
    
    that.dgLoading = false;
  }

  // change handler
  pageChange(event: any) {
    if (event.page.current <= 1) {// size change
      if (event.page.size !== this.defaultSize) {
        this.getRiskReportList(true, event.page.size)
      } else {
      }
    } else {// page change
      if (event.page.size !== this.defaultSize) {
        this.getRiskReportList(false, event.page.size, event.page.from)
      } else {
        this.getRiskReportList(false, event.page.size, event.page.from)
      }

    }
  }

  getRiskReportList(reset: boolean, size?: number, from?:number) {
    const query: any = { 
      size: size ? size :10,
      from: from ? from: 0
    };
    function callBack(data: any, that: any) {
      if (reset) {
        that.kubeBenchReportList = []        
        that.kubeBenchReportList = data.hits.hits
        that.pagination.page.change
        that.dgLoading = false
      } else {
        that.riskCallBack(data,that)
      }
    }
    this.getRiskList(query, callBack)
  }


  showDetail(detail: any) {
    this.showDetailFlag = true
    this.currentDetail = detail
  }

  hideDetai(event: any) {
    if (event.target.classList[0] === 'report-detai-bg') {
      this.showDetailFlag = false
    }
  }
}
