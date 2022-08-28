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
    chart: {
      backgroundColor: '#1C2A32',
      style: {
        color: '#FFFFFF'
      },
      type: 'bar'
    },
    title: {
      style: {
        color: '#FFFFFF'
      },
      text: 'namespace workloads histogram'
    },
    xAxis: {
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      categories: [],
    },
    yAxis: {
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      allowDecimals:false
    },
    legend: {
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      floating: true,
      align: 'top',
      x: 100,
      verticalAlign: 'top',
      y: 70
    },
    series: [{
      name: 'workload amount',
      data: []
    }]
  }

  public namespacChartLineOption:any = {
    title: {
      style: {
        color: '#FFFFFF'
      },
      text: 'namespace violations histogram'
    },
    chart: {
      style: {
        color: '#FFFFFF'
      },
      backgroundColor: '#1C2A32',
      type: 'bar'
    },
    xAxis: {
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      categories: []
    },
    yAxis: {
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      allowDecimals:false
    },
    legend: {
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      floating: true,
      align: 'left',
      x: 100,
      verticalAlign: 'top',
      y: 70
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.category}: {point.y}'
    },
    series: [
      {
        name: 'violation amount',
        color: 'red',
        data: []
      }
    ]
  }

  public workloadChartbarOption: any = {
    title: {
      text: 'workloads type histogram',
      style: {
        color: '#FFFFFF'
      },
    },
    chart: {
      backgroundColor: '#1C2A32',
      style: {
        color: '#FFFFFF'
      },
      type: 'bar'
    },
    xAxis: {
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      categories: ['Deployment', 'ReplicaSet', 'StatefulSet', 'DaemonSet', 'CronJob', 'Job']
    },
    yAxis: {
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      allowDecimals:false
    },
    legend: {
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      floating: true,
      align: 'left',
      x: 100,
      verticalAlign: 'top',
      y: 70
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.category}: {point.y}'
    },
    series: [
      {
        name: 'violation amount',
        color: 'red',
        data: []
      }
    ]
  }

  public reportLineChartOption:any = {
    title: {
      text: 'The number of containers in last 10 assessment reports',
      style: {
        color: '#FFFFFF'
      }
    },
    chart: {
      backgroundColor: '#1C2A32',
      style: {
        color: '#FFFFFF'
      },
      borderWidth: 2,
      type: 'line'
    },
    xAxis: {
      categories: [],
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      gridLineWidth: 1,
      gridLineColor: '#ECECEE',
      gridLineDashStyle: 'Dash'
    },
    yAxis: {
      title: {
        style: {
          color: '#FFFFFF'
        }
      },
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      gridLineColor: '#ECECEE',
      gridLineDashStyle: 'Dash'
    },
    legend: {
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      floating: true,
      style: {
        color: '#FFFFFF'
      },
      align: 'left',
      x: 100,
      verticalAlign: 'top',
      y: 70
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.category}: {point.y}'
    },
    series: [{
      name: 'numbers of containers',
      color: 'red',
      data: []
    }]
  }

  public clusterLineChartOption:any = {
    title: {
      text: 'Report history',
      style: {
        color: '#FFFFFF'
      }
    },
    chart: {
      backgroundColor: '#1C2A32',
      style: {
        color: '#FFFFFF'
      },
      borderWidth: 2,
      type: 'line'
    },
    xAxis: {
      categories: [],
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      gridLineWidth: 1,
      gridLineColor: '#ECECEE',
      gridLineDashStyle: 'Dash'
    },
    yAxis: {
      title: {
        style: {
          color: '#FFFFFF'
        }
      },
      labels: {
        style: {
          color: '#FFFFFF'
        }
      },
      gridLineColor: '#ECECEE',
      gridLineDashStyle: 'Dash'
    },
    legend: {
      layout: 'vertical',
      backgroundColor: '#FFFFFF',
      floating: true,
      style: {
        color: '#FFFFFF'
      },
      align: 'left',
      x: 100,
      verticalAlign: 'top',
      y: 70
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.category}: {point.y}'
    },
    series: [
      {
        name: 'normal',
        color: 'green',
        data: []
      },
      {
        name: 'abnormal',
        color: '#FF6484',
        data: []
      },
      {
        name: 'total',
        color: '#37A2EB',
        data: []
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
  getNodeList(){    
    return this.http.get(this.environment.api.k8s + '/nodes')
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

}
