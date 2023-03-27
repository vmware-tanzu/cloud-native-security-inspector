/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AssessmentReportType, AssessmentType, NamespaceModel, NameSpaceSourceModel } from './policy-model-type';
@Injectable({
  providedIn: 'root'
})
export class ShardService {
  public environment:any = environment
  public navVariable = 'Cluster'
  public allNormal = 0
  public allCompliant = 0
  public allAbnormal = 0
  public showNormal = 0
  public showCompliant = 0
  public showAbnormal = 0
  public updateFlag = false
  public nodesInfo:any = {
    version: '',
    cpu: {
      capacity: 0,
      allocatable: 0
    },
    memory: {
      capacity: 0,
      allocatable: 0
    }
  }
  // Report scan time stamp
  public scanTime = ''
  // Namespace infp
  public namespaceList:NamespaceModel[] = []
  // cluster violation list
  public violationList:{namespace:string, workload:any}[] = []
  // namespace violation list
  public currentNamespaceviolationList:any = []

  // current namespace Info
  public currentNamespaceInfo!:NamespaceModel
  // namespace summary select value
  public namespaceDefault = ''
  public clusterChartBarOptions:any = {
    title: {
      style: {
        color: '#FFFFFF'
      },
      text: 'namespace workloads histogram'
    },
    xAxis: [],
    series: [
      {
        label: 'Number of Workloads',
        data: [],
        backgroundColor: [
          '#37A2EB'
        ],
        borderColor: [
          '#37A2EB'
      ],
        borderWidth: 3
      },
    ]
  }

  public namespacChartLineOption:any = {
    title: {
      style: {
        color: '#FFFFFF'
      },
      text: 'namespace violations histogram'
    },
    xAxis: [],
    series: [
      {
        label: 'Number of Violations',
        data: [],
        backgroundColor: [
          '#EE6666'
        ],
        borderColor: [
          '#EE6666'
      ],
        borderWidth: 3
      },
    ]
  }

  public workloadChartbarOption: any = {
    title: {
      text: 'workloads type histogram',
      style: {
        color: '#FFFFFF'
      },
    },
    xAxis: [],
    series: [
      {
        label: 'Number of Violations',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: [
          '#EE6666'
        ],
        borderColor: [
          '#EE6666'
        ],
        borderWidth: 1
      }
    ]
  }

  public reportLineChartOption:any = {
    xAxis: [],
    series: [
      {
        label: 'numbers of containers',
        data: [],
        backgroundColor: [
          '#EE6666'
        ],
        borderColor: [
          '#EE6666'
      ],
        borderWidth: 3
      },
    ]
  }

  public clusterLineChartOption:any = {
    title: {
      text: 'Report history',
      style: {
        color: '#FFFFFF'
      }
    },
    xAxis: [],
    series: [
      {
        label: 'normal',
        data: [],
        backgroundColor: [
          '#3BA272'
        ],
        borderColor: [
          '#3BA272'
      ],
        borderWidth: 3
      },
      {
        label: 'abnormal',
        data: [],
        backgroundColor: [
          '#EE6666'
        ],
        borderColor: [
          '#EE6666'
      ],
        borderWidth: 3
      },
      {
        label: 'total',
        data: [],
        backgroundColor: [
          '#37A2EB'
        ],
        borderColor: [
          '#37A2EB'
      ],
        borderWidth: 3
      }
    ]
    
  }

  public clusterChartBarUpdateFlag = true
  public reportslist:AssessmentType[] = []
  public clusterNamespaceWorkloadAmount:number[] = []
  public findingList:any[] = []
  public allWorkloadList:any[] = [ ]
  public newReport!:AssessmentType
  public currentWorkload!: {namespace: string, workload:any}
  public currentReport!:any
  public showWorkloadDetailFlag = false
  public packedbubbleRender!:Function
  constructor(private http:HttpClient) {
  }
  getNodeList(): Observable<{items: any[]}>{    
    return this.http.get<{items: any[]}>(this.environment.api.k8s + '/nodes')
  }

  getNodeStatus(name:string) {
    return this.http.get(this.environment.api.k8s + `/nodes/${name}/status`)
  }

  getNamespaceList() {
    return this.http.get<{items:NameSpaceSourceModel[]}>(this.environment.api.k8s + '/namespaces')
  }

  getApiservice() {
    return this.http.get(this.environment.api.apiregistration + '/apiservices')
  }

  getPodList(): Observable<{items: any[]}>{    
    return this.http.get<{items: any[]}>(this.environment.api.k8s + '/pods')
  }


}
