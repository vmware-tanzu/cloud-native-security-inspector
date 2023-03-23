/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { AssessmentService } from 'src/app/service/assessment.service'
import { LineComponent } from '../../report/line/line.component';
import { ReportViewDetailComponent } from '../report-view-detail/report-view-detail.component'
import { echarts, LineSeriesOption } from 'src/app/shard/shard/echarts';
import * as moment from 'moment';
type ECOption = echarts.ComposeOption<LineSeriesOption>


@Component({
  selector: 'app-report-view',
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.less']
})
export class ReportViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('reportline')reportline!: LineComponent|null
  @ViewChild('reportDetail')reportDetail!:ReportViewDetailComponent
  @ViewChild('pagination') pagination!:any
  public pageSizeOptions = [10, 20, 50, 100, 500];
  public showDetailFlag = false
  public pageMaxCount = 1
  public continues = ''
  public defaultSize = 10
  public lastPage = 1
  public dgLoading = false
  namespaceFilterFlag = false
  nameFilterFlag = false
  imagesReportList:any[] = []
  // charts
  echartsOption!: ECOption
  myChart!: any

  // opensearch
  opensearchInfo: any = {}
  client = ''
  ca = ''
  oldKey = ''
  oldValue = ''
  from = 0
  isOder = true
  getKubeBenchReportListQuery!:any
  getKubeBenchReportListFilter:any = {
    arg: {},
    reset: false
  }

  // unit test arg
  testMousedown:any = (e: any) => {}
  testMousemove:any = (e: any) => {}
  testMouseup:any = (e: any) => {}


  constructor(
    public shardService:ShardService,
    public policyService:PolicyService,
    private assessmentService:AssessmentService,
    public router:Router
  ) { }

  ngAfterViewInit(): void {
    let resizeLeft = 445
    var resize: any = document.getElementById("resize");
    var left: any = document.getElementById("left");
    var right: any = document.getElementById("right");
    var box: any = document.getElementById("box");
    console.log('init');
    this.testMousedown = resize.onmousedown = function (e: any) {
        var startX = e.clientX;          
        resize.left = resizeLeft;          
        this.testMousemove = document.onmousemove = function (e) {
            var endX = e.clientX;
            
            var moveLen = resize.left + (startX - endX);
                          if (moveLen < 445) moveLen = 445;
            if (moveLen > box.clientWidth-55) moveLen = box.clientWidth-55;


            resize.style.left = moveLen;
            resizeLeft = moveLen
            right.style.width = moveLen + "px";
            left.style.width = (box.clientWidth - moveLen - 5) + "px";
        }
        this.testMouseup= document.onmouseup = function () {
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
    this.getAssessmentreports()
  }

  
  ngOnDestroy(): void {}
    
  toReport(report: any) {    
    this.showDetailFlag = true
    this.shardService.currentReport = {
      _source: {
        reportUID: report._id,
        docId: report._source.docID,
        workloadNamespace: report._source.namespaceAssessments[0].namespace.name,
        createTime: report._source.timeStamp
      },
      workloadAssessments: report._source.namespaceAssessments[0].workloadAssessments
    }
  }
  // change handler
  
  pageChange(event: any) {  
    if (event.page.current <= 1) {// size change
      if (event.page.size !== this.defaultSize) {
        this.getKubeBenchReportList(
          // {key: this.oldKey, value: this.oldValue, size: event.page.size, from: 0, reset: true})
          {arg: {
            [this.oldKey]: this.oldValue
          }, size: event.page.size, from: 0, reset: true})
      } else {
      }
    } else {// page change

      if (event.page.size === 10 && this.defaultSize === 10) {// default
        if (event.page.current === this.pageMaxCount) {
          //lastpage
          this.getKubeBenchReportList(
            // {key: this.oldKey, value: this.oldValue, size: event.page.size, from: event.page.size * (this.pageMaxCount - 1), reset: false}
            {arg: {[this.oldKey]: this.oldValue}, size: event.page.size, from: event.page.size * (this.pageMaxCount - 1), reset: false}
            )
        } else {
          // pre / next
          this.getKubeBenchReportList(
            // {key: this.oldKey, value: this.oldValue, size: event.page.size, from: event.page.from, reset: false}
            {arg: {[this.oldKey]: this.oldValue}, size: event.page.size, from: event.page.from, reset: false}
            )
        }
      } else {
        // size and current change
        if (this.defaultSize === event.page.size) {
          // current change
          this.getKubeBenchReportList(
            // {key: this.oldKey, value: this.oldValue, size: event.page.size, from: event.page.from, reset: false})
            {arg: {[this.oldKey]: this.oldValue}, size: event.page.size, from: event.page.from, reset: false})
        } else {
          // size change
          this.pagination.currentPage = 1  
          event.page.size = 10
          this.getKubeBenchReportList(
            // {key: this.oldKey, value: this.oldValue, size: event.page.size, from: 0, reset: true})
            {arg: {[this.oldKey]: this.oldValue}, size: event.page.size, from: 0, reset: true})
        }
      }

    }
    this.defaultSize = event.page.size

  }
  getKubeBenchReportList(filter: {arg: {[key: string]: string}, size?: number, from?:number, reset: boolean}) {    
    const query: any = { 
      size: filter.size ? filter.size :10,
      from: filter.from ? filter.from: 0,
      sort: [
        {
          timeStamp: {
            order: "desc"
          }
        }
      ]
    };
    if (filter.arg) {
      query.query = {
        bool: {
          filter: [] as any[]
        },
      }
      for (const key in filter.arg) {
        this.getKubeBenchReportListFilter.arg[key] = filter.arg[key]
      }

      for (const key in this.getKubeBenchReportListFilter.arg) {
        if (this.getKubeBenchReportListFilter.arg[key]) {
          query.query.bool.filter.push({
            match: {
              [key]:  this.getKubeBenchReportListFilter.arg[key]
            }
          })
        }
      }
      this.getKubeBenchReportListFilter.reset = true
    }

    this.getKubeBenchReportListQuery = query
    this.getKubeBenchReportListFilter = filter    
    this.extractKubeBenchApi(query, this.getKubeBenchReportListCallBack)
  }
  getKubeBenchReportListCallBack(data: any, that: any) {
    let index = that.getKubeBenchReportListQuery.from-1;
    if (that.getKubeBenchReportListFilter.reset) {
      that.imagesReportList = []        
      that.pagination.page.current = 1
      that.imagesReportList = data.hits.hits
      that.pagination.lastPage = that.pageMaxCount        
      that.pagination.page.change
    } else {
      data.hits.hits.forEach((el: any) => {
        el._source.createTime = moment(el._source.createTime).format('LLL')
        if (that.getKubeBenchReportListQuery && data.hits.total.value) {          
          if ((that.getKubeBenchReportListQuery.from + that.getKubeBenchReportListQuery.size) <= data.hits.total.value) {
            for (index < that.getKubeBenchReportListQuery.from + that.getKubeBenchReportListQuery.size; index++;) {
              that.imagesReportList[index] = el
              break
            }
          } else {
            for (index < data.hits.total.value; index++;) {
              that.imagesReportList[index] = el
              break
            }
          }
        } else {
          that.imagesReportList.push(el)
        }
      })
    }
    that.dgLoading = false
  }
  // extract function 
  extractKubeBenchApi(query: any, callback: Function) {    
    this.dgLoading = true    
    if (this.opensearchInfo.url) {
      this.assessmentService.getKubeBenchReport({url: this.opensearchInfo.url, index: 'insight_report', username: this.opensearchInfo.user, password: this.opensearchInfo.pswd, query, client: this.client, ca:this.ca}).subscribe(
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

  // time sort
  createTimeSort() {
    let query: any = {
      size: this.defaultSize,
      from: this.from
    }
    this.isOder = !this.isOder
    if (this.isOder) {
      query['sort'] =[
        {
          timeStamp: {
            order: "desc"
          }
        }
      ]
    }
    this.extractKubeBenchApi(query, this.createTimeSortCallBack)
  }
  // time sort callback
  createTimeSortCallBack(data: any, that: any) {    
    that.imagesReportList = []
    that.pagination.page.current = 1
    that.pagination.page.size = that.defaultSize
    that.pagination.page.from = that.from
    that.pagination.page.change
    const result = data.hits.hits
    result.forEach((rp: {_source: {failures: string, createTime: string}}) => {
      rp._source.createTime = moment(rp._source.createTime).format('LLL')
    })    
    that.imagesReportList = data.hits.hits
    that.dgLoading = false
  }


  // get report data and render charts
  getAssessmentreports() {
    // open search
    const opensearchbase: any = localStorage.getItem('cnsi-open-search')
    const opensearchInfoJson = window.atob(opensearchbase)
    let opensearchInfo: any = {}
    if (opensearchInfoJson.slice(24)) opensearchInfo = JSON.parse(opensearchInfoJson.slice(24)) 
    if (opensearchInfo.url) {
      this.client = 'opensearch'
      this.opensearchInfo = opensearchInfo
    } else {
      this.echartsRender([], [])
      this.dgLoading = false
    }
    const query: any = { 
      size: 10,
      from: 0,
      sort: [
        {
          timeStamp: {
            order: "desc"
          }
        }
      ]
    }
    this.assessmentService.getKubeBenchReport({url: this.opensearchInfo.url, index: 'insight_report', username: this.opensearchInfo.user, password: this.opensearchInfo.pswd, query, client: this.client, ca:this.ca}).subscribe(
      data => {
        let lineDate: string[] = []
        let dataValue: any[] = []


        const result = data.hits.hits
        result.forEach((rp: {_source: {namespaceAssessments: {workloadAssessments: {failures: [], passed: boolean}[]}[], timeStamp: string}}) => {
          rp._source.timeStamp = moment(rp._source.timeStamp).format('LLL')
          let failures = 0
          rp._source.namespaceAssessments.forEach(ns => {
            ns.workloadAssessments.forEach(wd => {
              if (!wd.passed) {
                failures += wd.failures.length
              }
            });
          })

          lineDate.push(rp._source.timeStamp)
          let abCount = failures
          dataValue.push(abCount)
        })
        this.echartsRender(lineDate, dataValue)
        this.imagesReportList = data.hits.hits

      }
    )
  }

  // show report detail
  showDetail(event:any) {    
    for (let index = 0; index < event.target.classList.length; index++) { 
      if (event.target.classList[index] === 'report-detai-bg' || event.target.classList[index]  === 'report-detai-left') {
        this.showDetailFlag = false
        this.shardService.currentReport = null
        continue;
      }      
    }
  }

  // init
  echartsInit() {
    const chartDom = document.getElementById('report-line')!;
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
    if (sortArr[0] !==0 && sortArr[0] !== sortArr[sortArr.length-1]) {
      yAxis = {
        min: sortArr[0] - 10 < 0 ? 0 : sortArr[sortArr.length-1] - 10,
        max: sortArr[sortArr.length-1] + 10,
        interval: Math.ceil((sortArr[sortArr.length-1] - sortArr[0]) / 2) === 0 ? 10 : Math.ceil((sortArr[sortArr.length-1] - sortArr[0]) / 2),
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
          text: 'Number of Vulnerable Containers',
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
}
