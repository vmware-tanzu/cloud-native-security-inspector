import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AssessmentService } from 'src/app/service/assessment.service'
import { echarts, BarSeriesOption, LineSeriesOption } from 'src/app/shard/shard/echarts';
type ECOption = echarts.ComposeOption<BarSeriesOption>
type LineOption = echarts.ComposeOption<LineSeriesOption>
@Component({
  selector: 'app-kube-bench-report-list',
  templateUrl: './kube-bench-report-list.component.html',
  styleUrls: ['./kube-bench-report-list.component.less']
})
export class KubeBenchReportListComponent implements OnInit {
  @ViewChild('pagination') pagination:any
  // chart
  myChart!: any
  workNodeChart!: any
  k8sPolicyChart!: any
  echartsOption!: ECOption
  k8sechartsOption!: LineOption
  workechartsOption!: LineOption
  currentChart = 'work-node'
  echartsLoading = true
  // filter
  kubeTypeFilterFlag = false
  kubeNodeTypeFilterFlag = false
  oldKey = ''
  oldValue = ''
  // sort
  isOder = true
  // default data
  client = ''
  ca = ''
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

  ngOnInit(): void {
    this.init()
  }
  // init
  echartsInit(id: string, chart: 'myChart'| 'workNodeChart' | 'k8sPolicyChart') {
    const chartDom = document.getElementById(id)!;
    this[chart] = echarts.init(chartDom);
  }
  
  initKubeBenchReportList() {
    this.dgLoading = true
    const query: any = { 
      size: this.defaultSize,
      from: this.from,
      sort: [
        {
          createTime: {
            order: "desc"
          }
        }
      ]
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
              color: color[index] ? color[index] : '#566FC6'
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
          axisLabel: {formatter: '{value} PCS'},
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed',
              color: "#55b9b4"
            }
          }    
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

  init() {
    const opensearchbase: any = localStorage.getItem('cnsi-open-search')
    const elasticsearchbase: any = localStorage.getItem('cnsi-elastic-search')
    const opensearchInfoJson = window.atob(opensearchbase)
    const elasticsearchInfoJson = window.atob(elasticsearchbase)
    const opensearchInfo = JSON.parse(opensearchInfoJson.slice(24))   
    const elasticsearchInfo = JSON.parse(elasticsearchInfoJson.slice(24))  
    if (opensearchInfo.url) {
      this.client = 'opensearch'
      this.opensearchInfo = opensearchInfo
    } else if (elasticsearchInfo.url) {
      this.opensearchInfo = elasticsearchInfo
      this.client = 'elasticsearch'
      this.ca = elasticsearchInfo.ca
    } else {
      this.dgLoading = false
      this.echartsLoading = true
    }

    this.echartsInit('work-node', 'workNodeChart')
    this.echartsInit('k8s-policy', 'k8sPolicyChart')
    this.initKubeBenchReportList()
    // this.initKubeBenchReportTypes()
    this.getTextTypeTenReports('Worker Node Security Configuration')
    // this.getTextTypeTenReports('Kubernetes Policies')
  }
  // get list
  toKubeBenchReportTests(kube: any) {    
    sessionStorage.setItem(kube._id, JSON.stringify(kube))
    this.router.navigateByUrl(`assessments/kube-bench/test-view/${kube._id}`)
  }

  getKubeBenchReportList(filter: {key:string, value: string, size?: number, from?:number, reset: boolean}) {
    this.dgLoading = true
    const query: any = { 
      size: filter.size ? filter.size :10,
      from: filter.from ? filter.from: 0,
      sort: [
        {
          createTime: {
            order: "desc"
          }
        }
      ]
    };
    if (filter.key) {
      if (!this.oldKey) {
        this.oldKey = filter.key
        this.oldValue = filter.value
        this.pagination.page.size = 10
        filter.reset = true
      } else {
        if (this.oldKey === filter.key) {
          if (this.oldValue === filter.value) {
            filter.reset = false
          } else {
            filter.reset = true
          }
        } else {
          filter.reset = true
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
      let index = query.from-1;
      if (filter.reset) {
        that.kubeBenchReportList = []        
        that.pagination.page.current = 1
        // that.pagination.page.size = 10
        // that.pagination.page.from = that.from        
        that.kubeBenchReportList = data.hits.hits
        that.pagination.lastPage = that.pageMaxCount        
        that.pagination.page.change
      } else {
        data.hits.hits.forEach((el: any) => {
          if (query && data.hits.total.value) {          
            if ((query.from + query.size) <= data.hits.total.value) {
              for (index < query.from + query.size; index++;) {
                that.kubeBenchReportList[index] = el
                break
              }
            } else {
              for (index < data.hits.total.value; index++;) {
                that.kubeBenchReportList[index] = el
                break
              }
            }
          } else {
            that.kubeBenchReportList.push(el)
          }
        })
      }
      that.dgLoading = false
    }
    this.extractKubeBenchApi(query, callBack)
  }

  // switch E charts
  cutEchart(text: 'work-node'| 'policy') {
    this.currentChart = text
    switch (text) {
      case 'work-node':
        this.getTextTypeTenReports('Worker Node Security Configuration')
        break;
      case 'policy':
        this.getTextTypeTenReports('Kubernetes Policies')  

        break;
      default:
        break;
    }
  }

  // change handler
  pageChange(event: any) {
    if (event.page.current <= 1) {// size change
      if (event.page.size !== this.defaultSize) {
        this.getKubeBenchReportList(
          {key: this.oldKey, value: this.oldValue, size: event.page.size, from: 0, reset: true})
      } else {
      }
    } else {// page change

      if (event.page.size === 10 && this.defaultSize === 10) {// default
        if (event.page.current === this.pageMaxCount) {
          //lastpage
          this.getKubeBenchReportList(
            {key: this.oldKey, value: this.oldValue, size: event.page.size, from: event.page.size * (this.pageMaxCount - 1), reset: false}
            )
        } else {
          // pre / next
          this.getKubeBenchReportList(
            {key: this.oldKey, value: this.oldValue, size: event.page.size, from: event.page.from, reset: false}
          )
        }
      } else {
        // size and current change
        if (this.defaultSize === event.page.size) {
          // current change
          this.getKubeBenchReportList(
            {key: this.oldKey, value: this.oldValue, size: event.page.size, from: event.page.from, reset: false})
        } else {
          // size change
          this.pagination.currentPage = 1  
          event.page.size = 10
          this.getKubeBenchReportList(
            {key: this.oldKey, value: this.oldValue, size: event.page.size, from: 0, reset: true})
        }
      }

    }
    this.defaultSize = event.page.size

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
    if (this.opensearchInfo.url) {
      this.assessmentService.getKubeBenchReport({url: this.opensearchInfo.url, index: 'cis_report', username: this.opensearchInfo.user, password: this.opensearchInfo.pswd, query, client: this.client, ca:this.ca}).subscribe(
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

  // draw charts
  drawCharts (data: any, title: string): LineOption {
    const hits = data.hits.hits
    const xAxis: {value: string, textStyle: {color: string}}[] = []
    const infoList: number[] = []
    const passList: number[] = []
    const warnList: number[] = []
    const failList: number[] = []
    hits.forEach((hit: {_source: {createTime: string, total_pass: number, total_fail: number, total_warn: number, total_info: number}}) => {
      xAxis.push({
        value: hit._source.createTime,
        textStyle: {
          color: '#fff'
        }
      })
      infoList.push(hit._source.total_info)
      passList.push(hit._source.total_pass)
      warnList.push(hit._source.total_warn)
      failList.push(hit._source.total_fail)
    });

    return {
      title: {
        text: title,
        textStyle: {
          color: '#fff',
          // overflow: 'truncate',
          // width: '170'
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        textStyle: {
          color: "#ffffff"
        },
        data: ['Inform', 'Passed', 'Warned', 'Failed']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxis
      },
      yAxis: {
        type: 'value',
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: "#55b9b4"
          }
        }
      },
      series: [
        {
          name: 'Inform',
          type: 'line',
          stack: 'Total',
          data: infoList
        },
        {
          name: 'Passed',
          type: 'line',
          stack: 'Total',
          data: passList
        },
        {
          name: 'Warned',
          type: 'line',
          stack: 'Total',
          data: warnList
        },
        {
          name: 'Failed',
          type: 'line',
          stack: 'Total',
          data: failList
        }
      ]
    };
  }

  //Get nearly 10 reports of each type according to text classification
  getTextTypeTenReports(text: string) {
    const query = {
      query: {
        match: {
          text: text
        }
      },
      from: 0,
      size: 10,
      sort: [
        {
          createTime: {
            order: "desc"
          }
        }
      ]       
    }

    this.assessmentService.getKubeBenchReport({url: this.opensearchInfo.url, index: 'cis_report', username: this.opensearchInfo.user, password: this.opensearchInfo.pswd, query, client: this.client, ca:this.ca}).subscribe(
      data => {
        console.log('da', data);
 

        switch (text) {
          case 'Worker Node Security Configuration':
            this.workechartsOption = this.drawCharts(data, 'Worker Node Security Configuration');
            this.workNodeChart.clear()
            this.workechartsOption && this.workNodeChart.setOption(this.workechartsOption);
            break;
        
          case 'Kubernetes Policies':
            this.k8sechartsOption = this.workechartsOption = this.drawCharts(data, 'Kubernetes Policies');

            this.k8sPolicyChart.clear()
            this.k8sechartsOption && this.k8sPolicyChart.setOption(this.k8sechartsOption);

            break
          default:
            break;
        }
      }
    )
    
  }
}
