/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
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

  // charts
  echartsOption!: ECOption
  myChart!: any

  constructor(
    public shardService:ShardService,
    public policyService:PolicyService,
    public router:Router
  ) { }
  ngAfterViewInit(): void {
    let resizeLeft = 445
    var resize: any = document.getElementById("resize");
    var left: any = document.getElementById("left");
    var right: any = document.getElementById("right");
    var box: any = document.getElementById("box");
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
    this.policyService.getAllAssessmentreports().subscribe(
      data => {
        let lineDate: string[] = []
        let dataValue: any[] = []
        if (data.items && data.items.length > 10) {
          const result = data.items.splice(data.items.length - 10)
          result.forEach(el => {
            let abCount = 0
            el.metadata.creationTimestamp = moment(el.metadata.creationTimestamp).format('LLL')
            lineDate.push(el.metadata.creationTimestamp)

            el.spec.namespaceAssessments.forEach(namespace => {
              namespace.workloadAssessments.forEach(workload => {
                if (workload.failures) {
                  abCount+=workload.failures.length
                }
              });
            })
            dataValue.push(abCount)
          })
        } else {
          data.items.forEach(el => {
            let abCount = 0
            el.metadata.creationTimestamp = moment(el.metadata.creationTimestamp).format('LLL')
            lineDate.push(el.metadata.creationTimestamp)

            el.spec.namespaceAssessments.forEach(namespace => {
              namespace.workloadAssessments.forEach(workload => {
                if (workload.failures) {
                  abCount+=workload.failures.length
                }
              });
            })
            dataValue.push(abCount)
          })
        }
        this.echartsRender(lineDate, dataValue)
      }
    )
  }

  
  ngOnDestroy(): void {}
    
  toReport(report: any) {
    this.showDetailFlag = true
    const annotations:{key:string, value:string}[] = []
    const labels:{key:string, value:string}[] = []
    for (const key in report.metadata.annotations) {
      annotations.push({
        key,
        value: report.metadata.annotations[key]
      })
    }
    report.metadata.annotations = annotations
    if (report.spec.inspectionConfiguration.namespaceSelector) {
      for (const key in report.spec.inspectionConfiguration.namespaceSelector.matchLabels) {
        labels.push({
          key,
          value: report.spec.inspectionConfiguration.namespaceSelector.matchLabels[key]
        })
      }
      report.spec.inspectionConfiguration.namespaceSelector.matchLabels = labels
    }
    this.shardService.currentReport = report
    this.reportDetail.currentReport = report.spec.namespaceAssessments[0]
  }

  pageChange(event: any) {
    this.dgLoading = true
    // to last page
    if (this.pagination.lastPage !== 1 && event.page.current === this.pagination.lastPage) {
      if (this.lastPage === this.pagination.lastPage - 1) {
        this.policyService.getAssessmentreports(event.page.size, this.continues).subscribe(
          data => {
            if (this.continues) {
              this.shardService.reportslist = [...this.shardService.reportslist , ...data.items]
            } else {
              this.shardService.reportslist = data.items
            }
            this.continues = data.metadata.continue
            this.pageMaxCount = Math.ceil((data.metadata.remainingItemCount + this.shardService.reportslist.length) / this.defaultSize)
            this.dgLoading = false
            this.lastPage = event.page.current    
          }
        )
        return
      } else {
        event.page.current = this.lastPage
        this.pagination.currentPage = this.lastPage
        return
      }
    }
    if (event.page.current <= 1) {
      this.continues = ''
    }
    if (event.page.size !== this.defaultSize) {
      this.defaultSize = event.page.size
      this.continues = ''
    }
    this.defaultSize = event.page.size;
    
    this.policyService.getAssessmentreports(event.page.size, this.continues).subscribe(
      data => {
        if (this.continues) {
          this.shardService.reportslist = [...this.shardService.reportslist , ...data.items]
        } else {
          this.shardService.reportslist = data.items
        }
        this.continues = data.metadata.continue
        this.pageMaxCount = Math.ceil((data.metadata.remainingItemCount + this.shardService.reportslist.length) / this.defaultSize)
        this.dgLoading = false
        this.lastPage = event.page.current
      }
    )
  }

  getAssessmentreports(event: any) {
    this.dgLoading = true
    this.policyService.getAssessmentreports(event.page.size, this.continues).subscribe(
      data => {
        if (this.continues) {
          this.shardService.reportslist = [...this.shardService.reportslist , ...data.items]
        } else {
          this.shardService.reportslist = data.items
        }
        this.continues = data.metadata.continue
        this.pageMaxCount = Math.ceil((data.metadata.remainingItemCount + this.shardService.reportslist.length) / this.defaultSize)
        this.dgLoading = false
        this.lastPage = event.page.current
      }
    )
  }

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
