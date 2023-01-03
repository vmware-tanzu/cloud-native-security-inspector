/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'

@Component({
  selector: 'app-workload-page',
  templateUrl: './workload-page.component.html',
  styleUrls: ['./workload-page.component.less']
})
export class WorkloadPageComponent implements OnInit, AfterViewInit {
  public pageSizeOptions = [10, 20, 50, 100, 500];
  constructor(
    public shardService:ShardService
  ) { }

  ngOnInit(): void { 
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
