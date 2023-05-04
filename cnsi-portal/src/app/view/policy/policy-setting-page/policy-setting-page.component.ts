import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { tap, filter } from 'rxjs/operators';
import { HarborService } from 'src/app/service/harbor.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service';

@Component({
  selector: 'app-policy-setting-page',
  templateUrl: './policy-setting-page.component.html',
  styleUrls: ['./policy-setting-page.component.less']
})
export class PolicySettingPageComponent implements OnInit {
  policyForm!: UntypedFormGroup;
  private isDisabled = false
  public checkES = ''
  public schedule = '*/3 * * * *'
  public importSchedule = '*/3 * * * *'
  public text = ''
  public isCornUpdateModal = false
  public importScheduleFlag = false
  public baselines = [
    {
      "kind":"vulnerability",
      "baseline":"High",
      "version":"v1.1",
      "scheme":"application/vnd.security.vulnerability.report; version=1.1"
    }
  ]
  imageList = [
    {
      name: 'inspector',
      url: 'projects.registry.vmware.com/cnsi/inspector:0.3.2'
    },
    {
      name: 'kubebench',
      url: 'projects.registry.vmware.com/cnsi/kubebench:0.3.2'
    },
    {
      name: 'risk',
      url: 'projects.registry.vmware.com/cnsi/risk:0.3.2'
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

    if (!data.image || data.image.length < 1) {
      result = true
    }

    if (!data.openSearchEnabled) {
      result = true
    }

    if (!data.openSearchEnabled) {
      delete data.openSearchAddr
      delete data.openSearchUser
      delete data.openSearchPasswd
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

  constructor(
    public shardService:ShardService,
    private formBuilder: UntypedFormBuilder,
    private harborService: HarborService,
    private policyService: PolicyService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.policyForm = this.formBuilder.group({
      inspectionSetting: this.formBuilder.group({
        name: {value: '', disabled: this.isDisabled},
        namespace: [''],
        historyLimit:[5],
        suspend: [false],
        concurrencyRule:['Forbid'],
        image:[['inspector']],
        imagePullPolicy: ['IfNotPresent'],
        settingsName: [''],
        openSearchEnabled: [true],
        openSearchAddrHeader: ['https://'],
        openSearchAddr: ['opensearch-cluster-master.opensearch:9200'],
        openSearchUser: ['admin'],
        openSearchPasswd: ['admin'],
        vacAssessmentEnabled: [false]
      }),
      inspectionStandard: this.formBuilder.group({
      }),
      inspectionResult: this.formBuilder.group({
        actions: [true],
      })
    })
  }

  ngOnInit(): void {
    this.route.params.subscribe(
      data => {
        this.text = data.id
        if (!this.text) {
          this.router.navigateByUrl('/policy')
        }
        if (this.text === 'update') {
          this.getInspectionpolicies()
        }
      }
    )
    this.getSettingList()
  }

  // policy item handler
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
          baseline:'High',
          version:'v1.1',
          scheme: 'application/vnd.security.vulnerability.report; version=1.1'
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

  //get Inspectionpolicies 
  getInspectionpolicies() {
    this.policyService.getInspectionpolicies().subscribe(
      (data: any) => {
        const policyList = data.items
        this.policyInfo = policyList[0]
        if (policyList.length > 0) {
          this.isDisabled = true
          this.policyForm.get('inspectionSetting')?.get('name')?.setValue(policyList[0].metadata.name)
          this.policyForm.get('inspectionSetting')?.get('namespace')?.setValue(policyList[0].spec.workNamespace)
          this.policyForm.get('inspectionSetting')?.get('historyLimit')?.setValue(policyList[0].spec.strategy.historyLimit)
          this.policyForm.get('inspectionSetting')?.get('suspend')?.setValue(policyList[0].spec.strategy.suspend)
          this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.setValue(policyList[0].spec.strategy.concurrencyRule)

          if (policyList[0].spec.inspector.image && policyList[0].spec.inspector.kubebenchImage) {
            if (policyList[0].spec.inspector.riskImage) {
              this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['inspector', 'kubebench', 'risk'])
            } else {
              this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['inspector', 'kubebench'])
            }
          } else {
            if (policyList[0].spec.inspector.image) {
              if (policyList[0].spec.inspector.riskImage) {
                this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['inspector', 'risk'])
              } else {
                this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['inspector'])
              }
            } else if (policyList[0].spec.inspector.kubebenchImage) {
              if (policyList[0].spec.inspector.riskImage) {
                this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['kubebench', 'risk'])
              } else {
                this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['kubebench'])
              }
            } else if (policyList[0].spec.inspector.riskImage) {
              if (policyList[0].spec.inspector.image) {
                this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['inspector', 'risk'])
              } else if (policyList[0].spec.inspector.kubebenchImage){
                this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['kubebench', 'risk'])
              } else {
                this.policyForm.get('inspectionSetting')?.get('image')?.setValue(['risk'])
              }
            }
          }

          this.policyForm.get('inspectionSetting')?.get('imagePullPolicy')?.setValue(policyList[0].spec.inspector.imagePullPolicy)
          this.policyForm.get('inspectionSetting')?.get('settingsName')?.setValue(policyList[0].spec.settingsName)

          this.policyForm.get('inspectionSetting')?.get('openSearchEnabled')?.setValue(true)
          this.policyForm.get('inspectionSetting')?.get('vacAssessmentEnabled')?.setValue(policyList[0].spec.vacAssessmentEnabled ? true : false)

          if (policyList[0].spec.inspector.exportConfig.openSearch) {
            const addr = policyList[0].spec.inspector.exportConfig.openSearch.hostport.split('//')

            this.policyForm.get('inspectionSetting')?.get('openSearchAddrHeader')?.setValue(addr[0]+'//')
            this.policyForm.get('inspectionSetting')?.get('openSearchAddr')?.setValue(addr[1])

            this.policyForm.get('inspectionSetting')?.get('openSearchUser')?.setValue(policyList[0].spec.inspector.exportConfig.openSearch.username)
            this.policyForm.get('inspectionSetting')?.get('openSearchPasswd')?.setValue(policyList[0].spec.inspector.exportConfig.openSearch.password)
          }

          this.baselines = policyList[0].spec.inspection.baselines
          this.schedule = policyList[0].spec.schedule
          this.importSchedule = policyList[0].spec.schedule
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
          const opensearchInfo =  {
            url: policyList[0].spec.inspector.exportConfig.openSearch.hostport,
            user: policyList[0].spec.inspector.exportConfig.openSearch.username,
            pswd: policyList[0].spec.inspector.exportConfig.openSearch.password
          }
  
          localStorage.setItem('cnsi-open-search', window.btoa('u749VQF7hEqDTZ2y161R9J8F'+JSON.stringify(opensearchInfo)))  

        } else {
          this.isDisabled = false
          this.policyForm.get('inspectionSetting')?.get('name')?.setValue('')
          this.policyForm.get('inspectionSetting')?.get('namespace')?.setValue('')
          this.policyForm.get('inspectionSetting')?.get('historyLimit')?.setValue(5)
          this.policyForm.get('inspectionSetting')?.get('suspend')?.setValue(false)
          this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.setValue('Forbid')
          this.policyForm.get('inspectionSetting')?.get('image')?.setValue('projects.registry.vmware.com/cnsi/inspector:0.3.2')
          this.policyForm.get('inspectionSetting')?.get('imagePullPolicy')?.setValue('IfNotPresent')
          this.policyForm.get('inspectionSetting')?.get('settingsName')?.setValue('')
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
          this.schedule = '*/3 * * * *'
          this.importSchedule = '*/3 * * * *'
          localStorage.removeItem('cnsi-open-search')
        }

      },
      err => {
        console.log('err', err);
      }
    )
  }

  policyHandler(text: string) {
    if (text === 'create') {
      this.createPolicy()
    } else {
      this.modifyPolicy()
    }
  }
  createPolicy () {   
    this.checkES = ''
    const imagesList = this.policyForm.get('inspectionSetting')?.get('image')?.value

    const data :any = {
      name: this.policyForm.get('inspectionSetting')?.get('name')?.value,
      enabled: this.enabledSettings,
      settingsName: this.policyForm.get('inspectionSetting')?.get('settingsName')?.value,
      workNamespace: this.policyForm.get('inspectionSetting')?.get('namespace')?.value,
      schedule: this.schedule,
      strategy_concurrencyRule: this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.value,
      strategy_historyLimit: +this.policyForm.get('inspectionSetting')?.get('historyLimit')?.value,
      strategy_suspend: this.policyForm.get('inspectionSetting')?.get('suspend')?.value,
      inspector_imagePullPolicy: this.policyForm.get('inspectionSetting')?.get('imagePullPolicy')?.value,
      inspector_openSearch_hostport: this.policyForm.get('inspectionSetting')?.get('openSearchAddrHeader')?.value + this.policyForm.get('inspectionSetting')?.get('openSearchAddr')?.value,
      inspector_openSearch_username: this.policyForm.get('inspectionSetting')?.get('openSearchUser')?.value,
      inspector_openSearch_password: this.policyForm.get('inspectionSetting')?.get('openSearchPasswd')?.value,
      inspection_baselines: this.baselines,
      inspection_namespaceSelector: {
        matchLabels: {}
      },
      inspection_workloadSelector: {
        matchLabels: {}
      },
      vacAssessmentEnabled: this.policyForm.get('inspectionSetting')?.get('vacAssessmentEnabled')?.value
    }

    imagesList.forEach((image: any) => {
      if (image === 'inspector') {
        data.inspector_image = this.imageList[0].url
      } else if (image === 'kubebench') {
        data.inspector_kubebenchImage = this.imageList[1].url
      } else if (image === 'risk') {
        data.inspector_riskImage= this.imageList[2].url
      }
    });
    if(this.policyForm.get('inspectionResult')?.get('actions')?.value){
      data.inspection_actions = [
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
        data.inspection_namespaceSelector.matchLabels[el.key] = el.value
      })
    }
    if (this.workloadlabels.length > 0) {
      this.workloadlabels.forEach(el => {
        data.inspection_workloadSelector.matchLabels[el.key] = el.value
      })
    }    

    this.policyService.createPolicy(data).subscribe(
      data => {
        this.messageFlag = 'success'
        this.messageContent = 'Policy created!'
        this.router.navigateByUrl('/policy')
      },
      err => {
        this.messageFlag = 'fail'
        this.messageContent = err.error.message || 'Policy created fail!'
      }
    )
  }
  modifyPolicy () {
    this.checkES = ''    
    this.deletePolicy(this.policyForm.get('inspectionSetting')?.get('name')?.value)    
  }

  deletePolicy (deleteName: string) {
    this.policyService.deletePolicy(deleteName).subscribe(
      data => {
        this.createPolicy()
      },
      err => {
        this.messageFlag = 'fail'
        this.messageContent = err.error.message || 'Policy updated fail!'
      }
    )

  }

  // Schedule
  setSchedule (scheduleInfo: any) {
    this.schedule = ''
    for (const key in scheduleInfo) {
      this.schedule+=scheduleInfo[key]
    }
    this.importSchedule = this.schedule
  }
  saveSchedule(data:any) {
    this.schedule = data
    this.importSchedule = this.schedule
    this.isCornUpdateModal = false
  }
  cancelSchedule() {
    this.isCornUpdateModal = false
  }
}
