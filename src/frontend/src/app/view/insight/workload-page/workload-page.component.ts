/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardService } from 'src/app/service/shard.service'

@Component({
  selector: 'app-workload-page',
  templateUrl: './workload-page.component.html',
  styleUrls: ['./workload-page.component.less']
})
export class WorkloadPageComponent implements OnInit, AfterViewInit {
  public pageSizeOptions = [10, 20, 50, 100, 500];
  constructor(
    public shardService:ShardService,
    private assessmentService: AssessmentService
  ) { }

  ngOnInit(): void {
    this.getNewReport() 
  }
  ngAfterViewInit(): void {
    let resizeLeft = 445
    var resize: any = document.getElementById("work-resize");
    var left: any = document.getElementById("work-left");
    var right: any = document.getElementById("work-right");
    var box: any = document.getElementById("work-box");
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
  toWorkload(item:{namespace:string, workload:any}) {
    this.shardService.showWorkloadDetailFlag = true
    this.shardService.navVariable = 'Workload'
    this.shardService.currentWorkload = item
    // this.resetWorkload('workloadDetailFlag')
  }

  getNewReport() {    
    const opensearchbase: any = localStorage.getItem('cnsi-open-search')
    const opensearchInfoJson = window.atob(opensearchbase)
    if (!opensearchInfoJson.slice(24)) {
      return
    } else {
      const opensearchInfo = JSON.parse(opensearchInfoJson.slice(24))   
      const client = 'opensearch'
      if (opensearchInfo.url) {
        this.assessmentService.getKubeBenchReport({url: opensearchInfo.url, index: 'insight_report', username: opensearchInfo.user, password: opensearchInfo.pswd, query: {
          size: 1,
          from: 0,
          "query": {
            "match_all": {}
          }
        }, client, ca: ''}).subscribe(
          data => {

            this.shardService.allWorkloadList = []
            data.hits.hits.forEach((el: any) => {
              el._source.namespaceAssessments[0].workloadAssessments.forEach((workload: any) => {
                this.shardService.allWorkloadList.push({
                  namespace: el._source.namespaceAssessments[0].namespace.name,
                  workload: workload
                })
              });

            })
          },
          err => {}
        )
      }
    }

  }
  showDetail(event:any) {
    for (let index = 0; index < event.target.classList.length; index++) {      
      if (event.target.classList[index] === 'report-detai-bg' || event.target.classList[index]  === 'report-detai-left') {
        this.shardService.showWorkloadDetailFlag = false
        this.shardService.currentReport = null
        continue;
      }      
    }
  }
}
