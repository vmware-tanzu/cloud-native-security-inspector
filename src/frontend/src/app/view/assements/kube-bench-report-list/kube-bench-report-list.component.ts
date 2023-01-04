import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { AssessmentService } from 'src/app/service/assessment.service'
import { PolicyService } from 'src/app/service/policy.service';
import { echarts, BarSeriesOption, PieSeriesOption } from 'src/app/shard/shard/echarts';
type ECOption = echarts.ComposeOption<BarSeriesOption>
type PieOption = echarts.ComposeOption<PieSeriesOption>
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
  controlPlaneChart!: any
  controlPlaneSecurityChart!: any
  etcdNodeChart!: any

  // chartoptions
  echartsOption!: ECOption
  k8sechartsOption!: PieOption
  workechartsOption!: PieOption
  controlPlaneChartOption!: PieOption
  controlPlaneSecurityChartOption!: PieOption
  etcdNodeChartOption!: PieOption

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
    private assessmentService: AssessmentService,
    private policyService: PolicyService
  ) { }

  ngOnInit(): void {
    this.getInspectionpolicies()
  }
  // init
  echartsInit(id: string, chart: 'myChart'| 'workNodeChart' | 'k8sPolicyChart' | 'controlPlaneChart' | 'controlPlaneSecurityChart' | 'etcdNodeChart') {
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

  getInspectionpolicies() {
    this.policyService.getInspectionpolicies().subscribe(
      (data: any) => {
        if (data.items && data.items.length >0) {
          if (data.items[0].spec && data.items[0].spec.inspector && data.items[0].spec.inspector.kubebenchImage) {
            this.init()
          } else {
            this.echartsLoading = false
          }
        } else {
          this.echartsLoading = false
        }
      },
      err => {
        console.log('err', err);
      }
    )
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
    this.echartsInit('control-plane-security', 'controlPlaneSecurityChart')
    this.echartsInit('control-plane', 'controlPlaneChart')
    this.echartsInit('etcd-node', 'etcdNodeChart')
    this.initKubeBenchReportList()
  }
  // Get the latest report update chart for 5 types
  getFiveTypeReportUpdateChart() {
    this.echartsLoading = true
    this.getTextTypeTenReports('Worker Node Security Configuration')
    this.getTextTypeTenReports('Kubernetes Policies')
    this.getTextTypeTenReports('Control Plane Security Configuration')
    this.getTextTypeTenReports('Control Plane Configuration')
    this.getTextTypeTenReports('Etcd Node Configuration')
  }

  // get list
  toKubeBenchReportTests(kube: any) {    
    sessionStorage.setItem(kube._id, JSON.stringify(kube))
    this.router.navigateByUrl(`assessments/kube-bench/test-view/${kube._id}`)
  }

  getKubeBenchReportList(filter: {key:string, value: string, size?: number, from?:number, reset: boolean}) {
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
    this.getFiveTypeReportUpdateChart()
  }

  // draw charts
  drawCharts (data: any, title: string): PieOption {
    const hits = data.hits.hits[0]._source
    const xAxis: {value: string, textStyle: {color: string}}[] = []
    return {
      title: {
        text: title,
        textStyle: {
          color: '#fff',
          overflow: 'truncate',
          width: '300'
        },
        subtext: moment(hits.createTime).format('LLL'),
        subtextStyle: {
          color: '#fff',
          align: 'center',
          verticalAlign: 'bottom'
        },
        left: 'center',
        textVerticalAlign: 'top'
      },
      tooltip: {
        trigger: 'item'
      },
      series: [
        {
          name: 'Access From',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '40',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: hits.total_info, name: 'Inform', label: {color: '#fff'} },
            { value: hits.total_pass, name: 'Passed', label: {color: '#fff'} },
            { value: hits.total_warn, name: 'Warned', label: {color: '#fff'} },
            { value: hits.total_fail, name: 'Failed', label: {color: '#fff'} },
          ]
        }
      ]
    }
  }

  //Get nearly 1 reports of each type according to text classification
  getTextTypeTenReports(text: string) {
    this.echartsLoading = true
    const query = {
      query: {
        match: {
          text: text
        }
      },
      from: 0,
      size: 1,
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
        switch (text) {
          case 'Worker Node Security Configuration':
            this.workechartsOption = this.drawCharts(data, 'Worker Node Security Config');
            this.workNodeChart.clear()
            this.workechartsOption && this.workNodeChart.setOption(this.workechartsOption);
            break;
        
          case 'Kubernetes Policies':
            this.k8sechartsOption = this.drawCharts(data, 'Kubernetes Policies');

            this.k8sPolicyChart.clear()
            this.k8sechartsOption && this.k8sPolicyChart.setOption(this.k8sechartsOption);

            break

          case 'Control Plane Configuration':
            this.controlPlaneChartOption = this.drawCharts(data, 'Control Plane Config');

            this.controlPlaneChart.clear()
            this.controlPlaneChartOption && this.controlPlaneChart.setOption(this.controlPlaneChartOption);

            break
  
          case 'Control Plane Security Configuration':
            this.controlPlaneSecurityChartOption = this.drawCharts(data, 'Control Plane Security Config');

            this.controlPlaneSecurityChart.clear()
            this.controlPlaneSecurityChartOption && this.controlPlaneSecurityChart.setOption(this.controlPlaneSecurityChartOption);

            break

          case 'Etcd Node Configuration':
            this.etcdNodeChartOption = this.drawCharts(data, 'Etcd Node Config');

            this.etcdNodeChart.clear()
            this.etcdNodeChartOption && this.etcdNodeChart.setOption(this.etcdNodeChartOption);

            break
  
          default:
            break;
        }
        this.echartsLoading = false
      }
    )
    
  }
}
