import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
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
  defaultSize = 0
  from = 0
  pageMaxCount = 1
  currentPage = 1
  dgLoading = false
  public showDetailFlag = false
  echartsLoading = true
  riskList = []
  constructor(
    private assessmentService: AssessmentService
  ) { }

  ngOnInit(): void {
    this.echartsInit()
    const query: any = { 
      size:  this.defaultSize,
      from: 0,
      sort: [
        {
          createTime: {order: "desc"}
        }
      ]
    };

  }
  // init
  echartsInit() {
    const chartDom = document.getElementById('risk')!;
    this.myChart = echarts.init(chartDom);
  }
  // echarts render 
  echartsRender(dateList: any, valueList: any) {
    const sortArr  = JSON.parse(JSON.stringify(valueList))
    sortArr.sort(function (a: number, b: number) {
      return a-b;
    }); 
    let yAxis: any = {
      min: 0,
      max: 30,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: "#55b9b4"
        }
      }
    }
    if (sortArr[0] && sortArr[0] !==0 && sortArr[0] !== sortArr[sortArr.length-1]) {
      yAxis = {
        min: sortArr[0],
        max: sortArr[sortArr.length-1],
        interval: 25,
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: "#55b9b4"
          }
        }
      }
    } else if (sortArr[0] && sortArr[0] !==0) {
      yAxis = {
        min: sortArr[sortArr.length-1] - 50,
        max: sortArr[sortArr.length-1] + 50,
        interval: 25,
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: "#55b9b4"
          }
        }
      }
    }
    
    this.echartsOption = {
      // Make gradient line here
      visualMap: [
        {
          show: false,
          type: 'continuous',
          seriesIndex: 0,
          min: 0,
          max: 400
        }
      ],
    
      title: [
        {
          left: 'center',
          text: 'Number of Risks',
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
          type: 'category',
          data: dateList
        }
      ],
      yAxis: [
        yAxis
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
    if (!opensearchInfoJson.slice(24)) {
      this.dgLoading = false
    } else {
      const opensearchInfo = JSON.parse(opensearchInfoJson.slice(24))   
      // const elasticsearchInfo = JSON.parse(elasticsearchInfoJson.slice(24))  
      const client = 'opensearch'
      let ca = ''
      if (opensearchInfo.url) {
        this.opensearchInfo = opensearchInfo
        this.assessmentService.getKubeBenchReport({url: this.opensearchInfo.url, index: 'risk_manager_report', username: this.opensearchInfo.user, password: this.opensearchInfo.pswd, query, client, ca}).subscribe(
          data => {
            callback(data, this, query)
            this.pageMaxCount = Math.ceil( data.hits.total.value / this.defaultSize)
          },
          err => {}
        )
      } else {
        this.dgLoading = false
      }
    }

  }

  // risk callback
  riskCallBack(data: any, that: any, query?: any, max?: number) {
    const dateList: any = []
    const valueList: any = []
    let index = query.from-1;

    data.hits.hits.forEach((el: any) => {
      let risk_number = 0
      if (el._source.ReportDetail && el._source.ReportDetail.length > 0) {
        el._source.ReportDetail.forEach((re: any) => {
          risk_number+=re.Detail.length
        });
      }
      el['risk_number'] = risk_number
      dateList.push(moment(el._source.createTime).format('LLL'))
      valueList.push(el.risk_number)

      if (query && max) {          
        if ((query.from + query.size) <= max) {
          for (index < query.from + query.size; index++;) {
            that.riskList[index] = el
            break
          }
        } else {
          for (index < max; index++;) {
            that.riskList[index] = el
            break
          }
        }
      } else {
        that.riskList.push(el)
      }
    }); 
    
    
    that.echartsRender(dateList, valueList)
    that.dgLoading = false;
  }

  // change handler
  pageChange(event: any) {
    if (event.page.current <= 1) {// size change
      if (event.page.size !== this.defaultSize) {
        this.getRiskReportList(true, event.page.size, 0)
      } else {
      }
    } else {// page change

      if (event.page.size === 10 && this.defaultSize === 10) {// default
        if (event.page.current === this.pageMaxCount) {
          //lastpage
          this.getRiskReportList(false, event.page.size, event.page.size * (this.pageMaxCount - 1))
        } else {
          // pre / next
          this.getRiskReportList(false, event.page.size, event.page.from)
        }
      } else {
        // size and current change
        if (this.defaultSize === event.page.size) {
          // current change
          this.getRiskReportList(false, event.page.size, event.page.from)
        } else {
          // size change
          this.pagination.currentPage = 1  
          this.getRiskReportList(true, event.page.size, 0)
        }
      }

    }
    this.defaultSize = event.page.size
  }

  getRiskReportList(reset: boolean, size?: number, from?:number, current?: number) {
    const query: any = { 
      size: size ? size :10,
      from: from ? from: 0,
      sort: [
        {
          createTime: {order: "desc"}
        }
      ]
    };
    function callBack(data: any, that: any, query: any) {
      if (reset) {
        that.riskList = []        
        data.hits.hits.forEach((item: any) => {
          let risk_number = 0
          if (item._source.ReportDetail && item._source.ReportDetail.length > 0) {
            item._source.ReportDetail.forEach((re: any) => {
              risk_number+=re.Detail.length
            });
          }
          item['risk_number'] = risk_number
          that.riskList.push(item)
        });

        that.pageMaxCount = Math.ceil( data.hits.total.value / query.size)
        that.pagination.lastPage = that.pageMaxCount        
        that.pagination.page.change   
        that.dgLoading = false;

        if (that.echartsLoading) {
          const dateList: any = []
          const valueList: any = []
  
          that.riskList.forEach((el: any) => {
            if (el.risk_number) {
              dateList.push(moment(el._source.createTime).format('LLL'))
              valueList.push(el.risk_number)
            }
          })
          that.echartsRender(dateList, valueList)
          that.echartsLoading = false
        }          

      } else {
        that.riskCallBack(data,that, query, data.hits.total.value)
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
