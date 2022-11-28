import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AssessmentService } from 'src/app/service/assessment.service'
import { echarts, BarSeriesOption } from 'src/app/shard/shard/echarts';
type ECOption = echarts.ComposeOption<BarSeriesOption>
@Component({
  selector: 'app-kube-bench-report-list',
  templateUrl: './kube-bench-report-list.component.html',
  styleUrls: ['./kube-bench-report-list.component.less']
})
export class KubeBenchReportListComponent implements OnInit {
  @ViewChild('pagination') pagination:any
  // chart
  myChart!: any
  echartsLoading = true
  // filter
  kubeTypeFilterFlag = false
  kubeNodeTypeFilterFlag = false
  oldKey = ''
  oldValue = ''
  // sort
  isOder = false
  // default data
  dgLoading = false
  defaultSize = 10
  from = 0
  pageMaxCount = 1
  opensearchInfo!: {url: string, user: string, pswd: string}
  kubeBenchReportList: any = [
  ]
  constructor(
    private router: Router,
    private assessmentService: AssessmentService
  ) { }

  echartsOption!: ECOption
  ngOnInit(): void {
    this.echartsInit()
    this.initKubeBenchReportList()
    this.initKubeBenchReportTypes()
  }
  // init
  echartsInit() {
    const chartDom = document.getElementById('main')!;
    this.myChart = echarts.init(chartDom);
  }

  initKubeBenchReportList() {
    this.dgLoading = true
    const query: any = { 
      size: this.defaultSize,
      from: this.from
    };
    function callBack(data: any, that: any) {
      that.echartsLoading = false
      that.kubeBenchReportList = data.hits.hits
      that.pageMaxCount = Math.ceil(data.hits.total.value / that.defaultSize)
      that.dgLoading = false
    }
    this.extractKubeBenchApi(query, callBack)
  }

  initKubeBenchReportTypes() {
    this.echartsLoading = true
    const query: any = {
      "size": 0,
      "aggs": {
        "response_codes": {
          "terms": {
            "field": "text",
            "size": 10
          }
        }
      }
    };
    function callBack(data: any, that: any) {
      const xAxis:any = []
      const color = ['#5470C6', '#91CB74', '#FAC858', '#EE6666', '#72C0DE', '#3BA272', '#FC8451']
      const series:any = []
      data.aggregations.response_codes.buckets.forEach((tp: {key: string, doc_count: number}, index: number) => {
        xAxis.push({
          value: tp.key,
          textStyle: {
            color: '#fff',
          }
        })
        series.push(
          {
            value: tp.doc_count,
            itemStyle: {
              color: color[index]
            }
          },
        )
      });
      that.echartsOption = {
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
          text: 'Kube Bench Reports Type',
          textStyle: {
            color: '#fff'
          },
          left: '40%'
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
      that.myChart.clear()
      that.echartsOption && that.myChart.setOption(that.echartsOption);
      that.echartsLoading = false
    }
    this.extractKubeBenchApi(query, callBack)
  }
  // get list
  toKubeBenchReportTests(kube: any) {    
    sessionStorage.setItem(kube._id, JSON.stringify(kube))
    this.router.navigateByUrl(`assessments/kube-bench/test-view/${kube._id}`)
  }

  getKubeBenchReportList(filter: {key:string, value: string, size?: number, from?:number}) {
    this.dgLoading = true
    let reset = false
    const query: any = { 
      size: filter.size ? filter.size :10,
      from: filter.from ? filter.from: 0
    };
    if (filter.key) {
      if (!this.oldKey) {
        this.oldKey = filter.key
        this.oldValue = filter.value
        reset = true
      } else {
        if (this.oldKey === filter.key) {
          if (this.oldValue === filter.value) {
            reset = false
          } else {
            reset = true
          }
        } else {
          reset = true
        }
      }
      if (filter.value) {
        query.query = {
          match: {} as any,
        }
        query.query.match[filter.key] = filter.value
      } else {
        this.oldKey = ''
        this.oldValue = ''
      }
    }
    function callBack(data: any, that: any) {
      if (reset) {
        that.kubeBenchReportList = []        
        that.pagination.page.current = 1
        that.pagination.page.size = that.defaultSize
        that.pagination.page.from = that.from        
        that.kubeBenchReportList = data.hits.hits
        that.pagination.page.change
      } else {
        data.hits.hits.forEach((el: any) => {
          that.kubeBenchReportList.push(el)
        });
      }
      that.dgLoading = false
    }
    this.extractKubeBenchApi(query, callBack)
  }

  // change handler
  pageChange(event: any) {
    this.dgLoading = true
    if (event.page.current <= 1) {// size change
      if (event.page.size !== this.defaultSize) {
        this.getKubeBenchReportList({key: this.oldKey, value: this.oldValue, size: event.page.size})
      } else {
        this.dgLoading = false
      }
    } else {// page change
      if (event.page.size !== this.defaultSize) {
        this.getKubeBenchReportList({key: this.oldKey, value: this.oldValue, size: event.page.size, from: event.page.from})
      } else {
        this.getKubeBenchReportList({key: this.oldKey, value: this.oldValue, from: event.page.from })
      }

    }
  }

  createTimeSort() {
    let query: any = {
      size: this.defaultSize,
      from: this.from
    }
    this.isOder = !this.isOder
    if (this.isOder) {
      query['sort'] =[
        {
          createTime: {
            order: "desc"
          }
        }
      ]
    }
    function callBack(data: any, that: any) {
      that.kubeBenchReportList = []
      that.pagination.page.current = 1
      that.kubeBenchReportList = data.hits.hits
      that.pagination.page.size = that.defaultSize
      that.pagination.page.from = that.from
      that.pagination.page.change    
      that.dgLoading = false
    }
    this.extractKubeBenchApi(query, callBack)
  }

  // extract function
  extractKubeBenchApi(query: any, callback: Function) {
    this.dgLoading = true
    const opensearchInfoJson = localStorage.getItem('cnsi-open-search') || "{}"
    const elasticsearchInfoJson = localStorage.getItem('cnsi-elastic-search') || "{}"
    const opensearchInfo = JSON.parse(opensearchInfoJson)   
    const elasticsearchInfo = JSON.parse(elasticsearchInfoJson)   
    let client = ''
    let ca = ''
    if (opensearchInfo.url || elasticsearchInfo.url) {
      if (opensearchInfo.url) {
        client = 'opensearch'
        this.opensearchInfo = opensearchInfo
      } else {
        this.opensearchInfo = elasticsearchInfo
        client = 'elasticsearch'
        ca = elasticsearchInfo.ca
      }
      this.assessmentService.getKubeBenchReport({url: this.opensearchInfo.url, index: 'cis_report', username: this.opensearchInfo.user, password: window.atob(this.opensearchInfo.pswd), query, client, ca}).subscribe(
        data => {
          callback(data, this)
          this.pageMaxCount = Math.ceil(data.hits.total.value / this.defaultSize)
        },
        err => {}
      )
    } else {
      this.dgLoading = false
    }
  }
}
