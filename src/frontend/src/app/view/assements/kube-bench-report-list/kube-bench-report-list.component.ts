import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { AssessmentService } from 'src/app/service/assessment.service'
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service';
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
  k8sechartsOption!: PieOption | null
  workechartsOption!: PieOption | null
  controlPlaneChartOption!: PieOption | null
  controlPlaneSecurityChartOption!: PieOption | null
  etcdNodeChartOption!: PieOption | null

  currentChart = 'work-node'
  echartsLoading = true
  // filter
  kubeTypeFilterFlag = false
  kubeNodeTypeFilterFlag = false
  oldKey = ''
  oldValue = ''
  getKubeBenchReportListQuery!:any
  getKubeBenchReportListFilter!:any
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
  nodeList: any[] = []
  currentNode = ''
  nodesPodsCorrespondence : {pod: string, node: string}[]= []
  constructor(
    private router: Router,
    private assessmentService: AssessmentService,
    private policyService: PolicyService,
    private shardService: ShardService
  ) { }

  ngOnInit(): void {
    this.getNodeList()
    this.getInspectionpolicies()
  }
  // init
  echartsInit(id: string, chart: 'myChart'| 'workNodeChart' | 'k8sPolicyChart' | 'controlPlaneChart' | 'controlPlaneSecurityChart' | 'etcdNodeChart') {
    const chartDom = document.getElementById(id)!;
    this[chart] = echarts.init(chartDom);
  }
  
  initKubeBenchReportList() {
    if (!this.currentNode) return
    const podInfo: any = this.nodesPodsCorrespondence.find(item => item.node === this.currentNode) || {pod: ''}
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
      ],
      query: {
        match: {
          node_name: podInfo.pod
        }
      }
    };
    this.extractKubeBenchApi(query, this.initKubeBenchReportListCallBack)
  }

  initKubeBenchReportListCallBack(data: any, that: any) {    
    that.echartsLoading = false
    that.kubeBenchReportList = data.hits.hits
    that.pageMaxCount = Math.ceil(data.hits.total.value / that.defaultSize)
    that.dgLoading = false
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
    let opensearchInfo: any = {}
    let elasticsearchInfo: any  = {}
    if (opensearchInfoJson.slice(24)) opensearchInfo = JSON.parse(opensearchInfoJson.slice(24)) 
    if (elasticsearchInfoJson.slice(24)) elasticsearchInfo = JSON.parse(elasticsearchInfoJson.slice(24))       
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

  // node
  getNodeList() {
    this.shardService.getNodeList().subscribe(
      data => {
        this.nodeList = []
        data.items.forEach(node => {
          this.nodeList.push({
            name: node.metadata.name
          })
        });
        this.currentNode = data.items[0]?.metadata.name || '';
        this.getPodList()
      }
    )
  }

  switchNode(node: any) {
    this.currentNode = node
    this.initKubeBenchReportList()
    
  }

  // pods
  getPodList() {
    this.shardService.getPodList().subscribe(
      data => {
        this.nodesPodsCorrespondence = []
        data.items.forEach(item => {
          if (item.metadata.name.indexOf('kubebench-daemonset') !== -1) {
            this.nodesPodsCorrespondence.push({
              node: item.spec.nodeName,
              pod: item.metadata.name
            })
          }
        })        
        this.init()
      }
    )

  }

  // Get the latest report update chart for 5 types
  getFiveTypeReportUpdateChart() {
    this.echartsLoading = true
    this.getTextTypeTenReports('1')
    this.getTextTypeTenReports('2')
    this.getTextTypeTenReports('3')
    this.getTextTypeTenReports('4')
    this.getTextTypeTenReports('5')
  }

  // get list
  toKubeBenchReportTests(kube: any) {  
    sessionStorage.setItem(kube._id, JSON.stringify(kube))
    this.router.navigateByUrl(`assessments/kube-bench/test-view/${kube._id}`)
  }

  getKubeBenchReportList(filter: {key:string, value: string, size?: number, from?:number, reset: boolean}) {    
    if (!this.currentNode) return
    const podNode: any = this.nodesPodsCorrespondence.find(item => item.node === this.currentNode) || {}
    const query: any = { 
      size: filter.size ? filter.size :10,
      from: filter.from ? filter.from: 0,
      sort: [
        {
          createTime: {
            order: "desc"
          }
        }
      ],
      query: {
        match: {
          node_name: podNode.pod
        }
      }
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
    this.getKubeBenchReportListQuery = query
    this.getKubeBenchReportListFilter = filter    
    this.extractKubeBenchApi(query, this.getKubeBenchReportListCallBack)
  }
  getKubeBenchReportListCallBack(data: any, that: any) {
    let index = that.getKubeBenchReportListQuery.from-1;
    if (that.getKubeBenchReportListFilter.reset) {
      that.kubeBenchReportList = []        
      that.pagination.page.current = 1
      that.kubeBenchReportList = data.hits.hits
      that.pagination.lastPage = that.pageMaxCount        
      that.pagination.page.change
    } else {
      data.hits.hits.forEach((el: any) => {
        if (that.getKubeBenchReportListQuery && data.hits.total.value) {          
          if ((that.getKubeBenchReportListQuery.from + that.getKubeBenchReportListQuery.size) <= data.hits.total.value) {
            for (index < that.getKubeBenchReportListQuery.from + that.getKubeBenchReportListQuery.size; index++;) {
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
    this.extractKubeBenchApi(query, this.createTimeSortCallBack)
  }
  createTimeSortCallBack(data: any, that: any) {    
    that.kubeBenchReportList = []
    that.pagination.page.current = 1
    that.kubeBenchReportList = data.hits.hits
    that.pagination.page.size = that.defaultSize
    that.pagination.page.from = that.from
    that.pagination.page.change    
    that.dgLoading = false
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
  drawCharts (data: any): PieOption|null {
    if (data.hits.hits[0]) {
      const hits = data.hits.hits[0]._source
      return {
        title: {
          text: hits.text.replace('Configuration', 'Config'),
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
    } else {
      return null
    }
  }

  //Get nearly 1 reports of each type according to text classification
  getTextTypeTenReports(id: string) {
    if (!this.currentNode) return
    const podInfo = this.nodesPodsCorrespondence.find(item => item.node === this.currentNode) || {pod: ''}
    this.echartsLoading = true
    const query = {
      query: {
        bool: {
          must: [
              {match: {id : id}},
              {match: {node_name : podInfo.pod}},
          ]
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
        switch (id) {
          case '1':
            this.workechartsOption = this.drawCharts(data);
            this.workNodeChart.clear()
            this.workechartsOption && this.workNodeChart.setOption(this.workechartsOption);
            break;
        
          case '2':
            this.k8sechartsOption = this.drawCharts(data);

            this.k8sPolicyChart.clear()
            this.k8sechartsOption && this.k8sPolicyChart.setOption(this.k8sechartsOption);

            break

          case '3':
            this.controlPlaneChartOption = this.drawCharts(data);

            this.controlPlaneChart.clear()
            this.controlPlaneChartOption && this.controlPlaneChart.setOption(this.controlPlaneChartOption);

            break
  
          case '4':
            this.controlPlaneSecurityChartOption = this.drawCharts(data);

            this.controlPlaneSecurityChart.clear()
            this.controlPlaneSecurityChartOption && this.controlPlaneSecurityChart.setOption(this.controlPlaneSecurityChartOption);

            break
  
          default:
            this.etcdNodeChartOption = this.drawCharts(data);

            this.etcdNodeChart.clear()
            this.etcdNodeChartOption && this.etcdNodeChart.setOption(this.etcdNodeChartOption);
          break;
        }
        this.echartsLoading = false
      }
    )
    
  }
}
