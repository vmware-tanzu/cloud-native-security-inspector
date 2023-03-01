/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';
import { ShardService } from './service/shard.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit{
  title='';
  lang: any = ''
  constructor(private shardService:ShardService, private i18: AppService) {
    this.getLang()
  }
  getLang() {
    this.lang = localStorage.getItem('tsi-language')
    if (this.lang) {
      this.i18.changeLanguage(this.lang)
    } else {
      if (window.navigator.language === 'zh-CN') {
        this.i18.changeLanguage('zh_CN')
      } else {
        this.i18.changeLanguage('en')
      }
    }
  }

  ngOnInit(): void {
    this.getNamespaceList()
  }
  getNamespaceList () {
    this.shardService.getNamespaceList().subscribe(
      data => {
        data.items.forEach(item => {
          this.shardService.namespaceList.push({
            name: item.metadata.name,
            creationTimestamp: item.metadata.creationTimestamp,
            labels: item.metadata.labels,
            resourceVersion: item.metadata.resourceVersion,
            status: item.status.phase,
            workloads: {
              workloads: [
                {
                  name: 'Deployment',
                  workloadList: [],
                  violationList: []
                },
                {
                  name: 'ReplicaSet',
                  workloadList: [],
                  violationList: []
                },
                {
                  name: 'StatefulSet',
                  workloadList: [],
                  violationList: []
                },
                {
                  name: 'DaemonSet',
                  workloadList: [],
                  violationList: []
                },
                {
                  name: 'CronJob',
                  workloadList: [],
                  violationList: []
                },
                {
                  name: 'Job',
                  workloadList: [],
                  violationList: []
                }
              ],
              violationList: [],
              normal: 0,
              abnormal: 0,
              compliant: 0
            }
          })          
        });
      }
    )
  }

}
