/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'
import { ActivatedRoute } from '@angular/router'
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PolicyService } from 'src/app/service/policy.service';
import { HarborService } from 'src/app/service/harbor.service';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.less']
})
export class PolicyComponent implements OnInit {
  policyForm!: FormGroup;
  private isDisabled = false
  public schedule = '3/* * * * *'
  public isCornUpdateModal = false
  public baselines = [
    {
      "kind":"vulnerability",
      "baseline":"High",
      "version":"v1.1",
      "scheme":"application/vnd.security.vulnerability.report; version=1.1"
    }
  ]
  public actions = [
    {
      "kind":"quarantine_vulnerable_workload"
    }
  ]
  public settingList:any = []
  public namespacelabels:any[] = []
  public workloadlabels:any[] = []
  public   createButtonFlag = true
  public policyInfo:any ={}
  public messageFlag = ''
  public messageContent = ''
  public enabledSettings = true

  get inspectionSettingValid() {
    let result = true
    const data = this.policyForm.get('inspectionSetting')?.value
    if (this.schedule) {
      result = false
    }
    for (const key in data) {
      if (data[key] === '') {
        result = true
      }
    }
    return result
  }

  get inspectionStandardValid() {
    return (()=> {
      const baseline = !this.baselines.every((el:any) => {
        let result = true
        for (const key in el) {
          if (el[key] === '') {
            result=false
          }
        }
        return result
      })
      const namespace = !this.namespacelabels.every(el => {
        let result = true
        for (const key in el) {
          if (el[key] === '') {
            result=false
          }
        }
        return result
      })
      const workload = !this.workloadlabels.every(el => {
        let result = true
        for (const key in el) {
          if (el[key] === '') {
            result=false
          }
        }
        return result
      })
      if (baseline === false && namespace === false && workload === false) {
        return false
      } else {
        return true
      }
    })()
  }

  get inspectionResultValid() {
    if (this.policyForm.get('inspectionResult')?.get('generate')?.value === true) {
      return this.policyForm.get('inspectionResult')?.get('liveTime')?.value ===''
    } else {
      return false
    }
  }

  constructor(
    public shardService:ShardService,
    private formBuilder: FormBuilder,
    private harborService: HarborService,
    private policyService: PolicyService
  ) {
    this.policyForm = this.formBuilder.group({
      inspectionSetting: this.formBuilder.group({
        name: {value: '', disabled: this.isDisabled},
        namespace: [''],
        historyLimit:[5],
        suspend: [false],
        concurrencyRule:['Forbid'],
        image:['projects.registry.vmware.com/cnsi/inspector:0.1'],
        imagePullPolicy: ['IfNotPresent'],
        settingsName: [''],
      }),
      inspectionStandard: this.formBuilder.group({
      }),
      inspectionResult: this.formBuilder.group({
        generate: [true],
        format: ['YAML'],
        liveTime: [3600],
        managedBy: [true],
        actions: [true],
      })
    })
  }

  ngOnInit(): void {
    this.getInspectionpolicies()
    this.getSettingList()
  }

  getSettingList(){
    this.harborService.getHarborSetting().subscribe(
      data => {
        this.settingList = data.items
      }
    )
  }

  policySettingAddItem(type: 'action' | 'baseline' | 'namespacelabels'| 'workloadlabels') {
    switch (type) {
      case 'action':
        this.actions.push({
          kind: ''
        })
        break;
      case 'baseline':
        this.baselines.push({
          kind: 'vulnerability',
          baseline:'',
          version:'',
          scheme: ''
        })
        break
      case 'namespacelabels':
        this.namespacelabels.push({
          key: '',
          value: ''
        })
        break
      case 'workloadlabels':
        this.workloadlabels.push({
          key: '',
          value: ''
        })
        break
  
      default:
        break;
    }

  }

  policySettingremoveItem(type: 'action' | 'baseline'| 'namespacelabels'| 'workloadlabels', index: number) {
    switch (type) {
      case 'action':
        this.actions.splice(index, 1)
        break;
      case 'baseline':
        this.baselines.splice(index, 1)
        break
      case 'namespacelabels':
        this.namespacelabels.splice(index, 1)
        break
      case 'workloadlabels':
        this.workloadlabels.splice(index, 1)
        break
          
      default:
        break;
    }
  }


  createPolicy () {    
    const data:any = {
      apiVersion: "goharbor.goharbor.io/v1alpha1",
      kind: "InspectionPolicy",
      metadata: {
        annotations: {},
        clusterName: "string",
        deletionGracePeriodSeconds: 0,
        finalizers: [],
        generateName: "",
        generation: 0,
        labels: {},
        managedFields: [],
        name: this.policyForm.get('inspectionSetting')?.get('name')?.value,
        namespace: '',
        ownerReferences: [],
        resourceVersion: "",
      },
      spec: {
        enabled: this.enabledSettings,
        inspection: {
          assessment: {
            format: this.policyForm.get('inspectionResult')?.get('format')?.value,
            generate: this.policyForm.get('inspectionResult')?.get('generate')?.value,
            liveTime: +this.policyForm.get('inspectionResult')?.get('liveTime')?.value,
            managedBy: this.policyForm.get('inspectionResult')?.get('managedBy')?.value
          },
          baselines: this.baselines,
          // dataProvider: {
          //   cache: {
          //     address: '',
          //     credential: {
          //       accessKey: this.policyForm.get('username')?.value,
          //       accessSecret: this.policyForm.get('password')?.value
          //     },
          //     database: 0,
          //     kind: "Redis",
          //     settings: {
          //       livingTime: 0,
          //       skipTLSVerify: true
          //     }
          //   },
          //   connection: {
          //     insecure: this.policyForm.get('insecure')?.value
          //   },
          //   credential: {
          //     accessKey: this.policyForm.get('username')?.value,
          //     accessSecret: this.policyForm.get('password')?.value
          //   },
          //   endpoint: this.policyForm.get('endpoint')?.value,
          //   provider: "Harbor"
          // },
          namespaceSelector: {
            matchExpressions: [],
            matchLabels: {}
          },
          workloadSelector: {
            matchExpressions: [],
            matchLabels: {}
          }
        },
        inspector: {
          image: this.policyForm.get('inspectionSetting')?.get('image')?.value,
          imagePullPolicy: this.policyForm.get('inspectionSetting')?.get('imagePullPolicy')?.value,
          imagePullSecrets: []
        },
        schedule: this.schedule,
        settingsName: this.policyForm.get('inspectionSetting')?.get('settingsName')?.value,
        strategy: {
          concurrencyRule: this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.value,
          historyLimit: +this.policyForm.get('inspectionSetting')?.get('historyLimit')?.value,
          suspend: this.policyForm.get('inspectionSetting')?.get('suspend')?.value
        },
        workNamespace: this.policyForm.get('inspectionSetting')?.get('namespace')?.value
      }
    }
    if(this.policyForm.get('inspectionResult')?.get('actions')?.value){
      data.spec.inspection.actions = [
        {
          ignore: {
            matchExpressions: [],
            matchLabels: {}
          },
          kind: this.actions[0].kind,
          settings: { }
        }
      ]
    }

    if (this.namespacelabels.length > 0) {
      this.namespacelabels.forEach(el => {
        data.spec.inspection.namespaceSelector.matchLabels[el.key] = el.value
      })
    }
    if (this.workloadlabels.length > 0) {
      this.workloadlabels.forEach(el => {
        data.spec.inspection.workloadSelector.matchLabels[el.key] = el.value
      })
    }


    this.policyService.createPolicy(data).subscribe(
      data => {
        this.messageFlag = 'success'
        this.messageContent = 'Policy created!'
        this.getInspectionpolicies()
      },
      err => {
        this.messageFlag = 'fail'
        this.messageContent = err.error.message || 'Policy created fail!'
      }
    )
  }
  modifyPolicy () {
    // this.policyInfo.metadata.name = this.policyForm.get('name')?.value
    this.policyInfo.spec.inspector.image = this.policyForm.get('inspectionSetting')?.get('image')?.value
    this.policyInfo.spec.inspector.imagePullPolicy = this.policyForm.get('inspectionSetting')?.get('imagePullPolicy')?.value
    this.policyInfo.spec.schedule = this.schedule
    this.policyInfo.spec.settingsName = this.policyForm.get('inspectionSetting')?.get('settingsName')?.value
    this.policyInfo.spec.strategy.concurrencyRule = this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.value
    this.policyInfo.spec.strategy.historyLimit = +this.policyForm.get('inspectionSetting')?.get('historyLimit')?.value
    this.policyInfo.spec.strategy.suspend = this.policyForm.get('inspectionSetting')?.get('suspend')?.value
    this.policyInfo.spec.workNamespace = this.policyForm.get('inspectionSetting')?.get('namespace')?.value
    if(this.policyForm.get('inspectionResult')?.get('actions')?.value){
      this.policyInfo.spec.inspection.actions = []
      this.actions.forEach(el => {
        this.policyInfo.spec.inspection.actions.push({
          ignore: {
            matchExpressions: [],
            matchLabels: {}
          },
          kind: el.kind,
          settings: {}
        })
      })
    } else {
      this.policyInfo.spec.inspection.actions = []
    }
    this.policyInfo.spec.inspection.assessment.format = this.policyForm.get('inspectionResult')?.get('format')?.value
    this.policyInfo.spec.inspection.assessment.generate = this.policyForm.get('inspectionResult')?.get('generate')?.value
    this.policyInfo.spec.inspection.assessment.liveTime = +this.policyForm.get('inspectionResult')?.get('liveTime')?.value
    this.policyInfo.spec.inspection.assessment.managedBy = this.policyForm.get('inspectionResult')?.get('managedBy')?.value
    this.policyInfo.spec.inspection.baselines = this.baselines
    if (this.policyInfo.spec.inspection.namespaceSelector) {
      this.policyInfo.spec.inspection.namespaceSelector.matchLabels = {}
    }
    if (this.policyInfo.spec.inspection.workloadSelector) {
      this.policyInfo.spec.inspection.workloadSelector.matchLabels = {}
    }
    if (this.namespacelabels.length > 0) {
      this.namespacelabels.forEach(el => {
        this.policyInfo.spec.inspection.namespaceSelector.matchLabels[el.key] = el.value
      })
    }
    if (this.workloadlabels.length > 0) {
      this.workloadlabels.forEach(el => {
        this.policyInfo.spec.inspection.workloadSelector.matchLabels[el.key] = el.value
      })
    }

    this.policyService.modifyPolicy(this.policyForm.get('inspectionSetting')?.get('name')?.value, this.policyInfo).subscribe(
      data => {
        this.messageFlag = 'success'
        this.messageContent = 'Policy updated!'
        this.getInspectionpolicies()
      },
      err => {
        this.messageFlag = 'fail'
        this.messageContent = err.error.message || 'Policy updated fail!'
      }
    )
    
  }

  deletePolicy () {
    this.policyService.deletePolicy(this.policyForm.get('inspectionSetting')?.get('name')?.value).subscribe(
      data => {
        this.messageFlag = 'success'
        this.messageContent = 'Policy deleted!'
        this.getInspectionpolicies()
      },
      err => {
        this.messageFlag = 'fail'
        this.messageContent = err.error.message || 'Policy deleted fail!'
      }
    )

  }

  setSchedule (scheduleInfo: any) {
    this.schedule = ''
    for (const key in scheduleInfo) {
      this.schedule+=scheduleInfo[key]
    }
  }

  getInspectionpolicies() {
    this.policyService.getInspectionpolicies().subscribe(
      (data: any) => {
        const policyList = data.items
        this.policyInfo = policyList[0]
        if (policyList.length > 0) {
          this.isDisabled = true
          this.createButtonFlag = false
          this.policyForm.get('inspectionSetting')?.get('name')?.setValue(policyList[0].metadata.name)
          this.policyForm.get('inspectionSetting')?.get('namespace')?.setValue(policyList[0].spec.workNamespace)
          this.policyForm.get('inspectionSetting')?.get('historyLimit')?.setValue(policyList[0].spec.strategy.historyLimit)
          this.policyForm.get('inspectionSetting')?.get('suspend')?.setValue(policyList[0].spec.strategy.suspend)
          this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.setValue(policyList[0].spec.strategy.concurrencyRule)
          this.policyForm.get('inspectionSetting')?.get('image')?.setValue(policyList[0].spec.inspector.image)
          this.policyForm.get('inspectionSetting')?.get('imagePullPolicy')?.setValue(policyList[0].spec.inspector.imagePullPolicy)
          this.policyForm.get('inspectionSetting')?.get('settingsName')?.setValue(policyList[0].spec.settingsName)
          // this.policyForm.get('endpoint')?.setValue(policyList[0].spec.inspection.dataProvider.endpoint)
          // this.policyForm.get('username')?.setValue(policyList[0].spec.inspection.dataProvider.credential.accessKey)
          // this.policyForm.get('password')?.setValue(policyList[0].spec.inspection.dataProvider.credential.accessSecret)
          // this.policyForm.get('insecure')?.setValue(policyList[0].spec.inspection.dataProvider.connection.insecure)
          this.policyForm.get('inspectionResult')?.get('generate')?.setValue(policyList[0].spec.inspection.assessment.generate)
          this.policyForm.get('inspectionResult')?.get('format')?.setValue(policyList[0].spec.inspection.assessment.format)
          this.policyForm.get('inspectionResult')?.get('liveTime')?.setValue(policyList[0].spec.inspection.assessment.liveTime)
          this.policyForm.get('inspectionResult')?.get('managedBy')?.setValue(policyList[0].spec.inspection.assessment.managedBy)
          this.baselines = policyList[0].spec.inspection.baselines
          this.schedule = policyList[0].spec.schedule
          if(policyList[0].spec.inspection.actions && policyList[0].spec.inspection.actions.length > 0){
            this.policyForm.get('inspectionResult')?.get('actions')?.setValue(true)
            this.actions = []
            policyList[0].spec.inspection.actions.forEach((el: any) => {
              this.actions.push({
                  "kind": el.kind
                })
            })
          } else {
            this.policyForm.get('inspectionResult')?.get('actions')?.setValue(false)
            this.actions = [
              {
                "kind":"quarantine_vulnerable_workload"
              }
            ]
          }
          if (policyList[0].spec.inspection.namespaceSelector) {
            this.namespacelabels=[]
            for (const key in policyList[0].spec.inspection.namespaceSelector.matchLabels) {
              this.namespacelabels.push({
                key,
                value:policyList[0].spec.inspection.namespaceSelector.matchLabels[key]
              })
            }
          }
          if (policyList[0].spec.inspection.workloadSelector) {
            this.workloadlabels = []
            for (const key in policyList[0].spec.inspection.workloadSelector.matchLabels) {
              this.workloadlabels.push({
                key,
                value:policyList[0].spec.inspection.workloadSelector.matchLabels[key]
              })
            }
          }


        } else {
          this.createButtonFlag = true
          this.isDisabled = false
          this.policyForm.get('inspectionSetting')?.get('name')?.setValue('')
          this.policyForm.get('inspectionSetting')?.get('namespace')?.setValue('')
          this.policyForm.get('inspectionSetting')?.get('historyLimit')?.setValue(5)
          this.policyForm.get('inspectionSetting')?.get('suspend')?.setValue(false)
          this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.setValue('Forbid')
          this.policyForm.get('inspectionSetting')?.get('image')?.setValue('projects.registry.vmware.com/cnsi/inspector:0.1')
          this.policyForm.get('inspectionSetting')?.get('imagePullPolicy')?.setValue('IfNotPresent')
          this.policyForm.get('inspectionSetting')?.get('settingsName')?.setValue('')
          // this.policyForm.get('endpoint')?.setValue(policyList[0].spec.inspection.dataProvider.endpoint)
          // this.policyForm.get('username')?.setValue(policyList[0].spec.inspection.dataProvider.credential.accessKey)
          // this.policyForm.get('password')?.setValue(policyList[0].spec.inspection.dataProvider.credential.accessSecret)
          // this.policyForm.get('insecure')?.setValue(policyList[0].spec.inspection.dataProvider.connection.insecure)
          this.policyForm.get('inspectionResult')?.get('generate')?.setValue(true)
          this.policyForm.get('inspectionResult')?.get('format')?.setValue('YAML')
          this.policyForm.get('inspectionResult')?.get('liveTime')?.setValue(3600)
          this.policyForm.get('inspectionResult')?.get('managedBy')?.setValue(true)
          this.policyForm.get('inspectionResult')?.get('actions')?.setValue(true)
          this.baselines = [
            {
              "kind":"vulnerability",
              "baseline":"High",
              "version":"v1.1",
              "scheme":"application/vnd.security.vulnerability.report; version=1.1"
            }
          ]
          this.actions = [
            {
              "kind":"quarantine_vulnerable_workload"
            }
          ]
          this.namespacelabels = []
          this.workloadlabels = []
          this.schedule = '3/* * * * *'
        }
      },
      err => {
        console.log('err', err);
      }
    )
  }

  saveSchedule(data:any) {
    this.schedule = data
    this.isCornUpdateModal = false
  }
  cancelSchedule(data:any) {
    this.isCornUpdateModal = false
  }
}
