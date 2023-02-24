import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { AssessmentService } from 'src/app/service/assessment.service';
import { RiskReportDetailComponent } from 'src/app/view/assements/risk-report-detail/risk-report-detail.component'
import { echarts, LineSeriesOption } from 'src/app/shard/shard/echarts';
import { PolicyService } from 'src/app/service/policy.service';
type ECOption = echarts.ComposeOption<LineSeriesOption>


@Component({
  selector: 'app-risk-report-view',
  templateUrl: './risk-report-view.component.html',
  styleUrls: ['./risk-report-view.component.less']
})
export class RiskReportViewComponent implements OnInit, AfterViewInit {
  @ViewChild('pagination') pagination:any
  @ViewChild('riskDetail') riskDetail!:RiskReportDetailComponent
  echartsOption!: ECOption
  myChart!: any
  opensearchInfo!: {url: string, user: string, pswd: string}
  currentDetail: any = {}
  riskImage = false
  defaultSize = 0
  from = 0
  pageMaxCount = 1
  currentPage = 1
  dgLoading = false
  public showDetailFlag = false
  echartsLoading = true
  riskList: any[] = []
  constructor(
    private assessmentService: AssessmentService,
    private policyService: PolicyService
  ) { }

  ngAfterViewInit(): void {
    let resizeLeft = 445
    var resize: any = document.getElementById("risk-resize");
    var left: any = document.getElementById("risk-left");
    var right: any = document.getElementById("risk-right");
    var box: any = document.getElementById("risk-box");
    console.log('init');
    resize.onmousedown = function (e: any) {
        var startX = e.clientX;          
        resize.left = resizeLeft;          
          document.onmousemove = function (e) {
            var endX = e.clientX;
            
            var moveLen = resize.left + (startX - endX);
                          if (moveLen < 445) moveLen = 445;
            if (moveLen > box.clientWidth-55) moveLen = box.clientWidth-55;


            resize.style.left = moveLen;
            resizeLeft = moveLen
            right.style.width = moveLen + "px";
            left.style.width = (box.clientWidth - moveLen - 5) + "px";
        }
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resize.releaseCapture && resize.releaseCapture();
        }
        resize.setCapture && resize.setCapture();
        return false;
    }
  }

  ngOnInit(): void {
    this.echartsInit()
    this.getInspectionpolicies()
  }
  // init
  echartsInit() {
    const chartDom = document.getElementById('risk')!;
    this.myChart = echarts.init(chartDom);
  }

  getInspectionpolicies() {
    this.policyService.getInspectionpolicies().subscribe(
      (data: any) => {
        if (data.items && data.items.length >0) {
          if (data.items[0].spec && data.items[0].spec.inspector.riskImage) {
            this.riskImage = true
          } else {            
            this.echartsRender([], [])
            this.echartsLoading = false
            this.dgLoading = false
            this.riskImage = false
          }
        } else {
          this.echartsRender([], [])
          this.echartsLoading = false
          this.dgLoading = false
          this.riskImage = false
        }
      },
      err => {
        console.log('err', err);
      }
    )
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
        min: sortArr[0] - 10 < 0 ? 0 : sortArr[0] - 10,
        max: sortArr[sortArr.length-1] + 10,
        interval: Math.ceil((sortArr[sortArr.length-1] - sortArr[0]) / 2) === 0 ? 10 : Math.ceil((sortArr[sortArr.length-1] - sortArr[0]) / 2) > 50 ? 50 : Math.ceil((sortArr[sortArr.length-1] - sortArr[0]) / 2),
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
        min: sortArr[0] - 10 < 0 ? 0 : sortArr[sortArr.length-1] - 10,
        max: sortArr[sortArr.length-1] + 10,
        interval: Math.ceil((sortArr[sortArr.length-1] - sortArr[0]) / 2) === 0 ? 5 : Math.ceil((sortArr[sortArr.length-1] - sortArr[0]) / 2),
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: "#55b9b4"
          }
        }
      }
    }
    dateList.reverse()
    valueList.reverse()
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
      if (el._source && el._source.ReportDetail && el._source.ReportDetail.length > 0) {
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
          if (item._source && item._source.ReportDetail && item._source.ReportDetail.length > 0) {
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
          if (that.riskImage) {
            that.echartsRender(dateList, valueList)
          }
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
    setTimeout(() => {
      this.riskDetail.dataSourceHandle()
    },100);
  }

  hideDetai(event:any) {
    for (let index = 0; index < event.target.classList.length; index++) { 
      if (event.target.classList[index] === 'report-detai-bg' || event.target.classList[index]  === 'report-detai-left') {
        this.showDetailFlag = false
        continue;
      }      
    }
  }
}
