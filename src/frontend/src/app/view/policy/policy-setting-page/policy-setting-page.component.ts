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
  public text = ''
  public isCornUpdateModal = false
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
      url: 'projects.registry.vmware.com/cnsi/inspector:0.3'
    },
    {
      name: 'kubebench',
      url: 'projects.registry.vmware.com/cnsi/kubebench:0.3'
    },
    {
      name: 'risk',
      url: 'projects.registry.vmware.com/cnsi/risk:0.3'
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

    if (!data.elasticSearchEnabled && !data.openSearchEnabled) {
      result = true
    }

    if (!data.elasticSearchEnabled) {      
      delete data.elasticSearchAddr
      delete data.elasticSearchUser
      delete data.elasticSearchPasswd
      delete data.elasticSearchCert
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

  get inspectionResultValid() {
    if (this.policyForm.get('inspectionResult')?.get('generate')?.value === true) {
      return this.policyForm.get('inspectionResult')?.get('liveTime')?.value ===''
    } else {
      return false
    }
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
        elasticSearchEnabled: [false],
        elasticSearchAddrHeader: ['https://'],
        elasticSearchAddr: [''],
        elasticSearchUser: [''],
        elasticSearchPasswd: [''],
        elasticSearchCert: [''],
        openSearchEnabled: [true],
        openSearchAddrHeader: ['https://'],
        openSearchAddr: ['opensearch-cluster-master.opensearch:9200'],
        openSearchUser: ['admin'],
        openSearchPasswd: ['admin'],
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

  testElasticSearch() {
    const testData = {
      url: this.policyForm.get('inspectionSetting')?.get('elasticSearchAddrHeader')?.value + this.policyForm.get('inspectionSetting')?.get('elasticSearchAddr')?.value,
      username: this.policyForm.get('inspectionSetting')?.get('elasticSearchUser')?.value, 
      password: this.policyForm.get('inspectionSetting')?.get('elasticSearchPasswd')?.value, 
      cert: this.policyForm.get('inspectionSetting')?.get('elasticSearchCert')?.value
    }    
    this.policyService.elasticSearchTest(testData).subscribe(
      data => {        
        this.checkES = 'passed'
      },
      err => {
        if (err.status === 200) {
          this.checkES = 'passed'
        } else {
          this.checkES = 'not passed'
        }
      }    )
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
          this.policyForm.get('inspectionResult')?.get('generate')?.setValue(policyList[0].spec.inspection.assessment.generate)
          this.policyForm.get('inspectionResult')?.get('format')?.setValue(policyList[0].spec.inspection.assessment.format)
          this.policyForm.get('inspectionResult')?.get('liveTime')?.setValue(policyList[0].spec.inspection.assessment.liveTime)
          this.policyForm.get('inspectionResult')?.get('managedBy')?.setValue(policyList[0].spec.inspection.assessment.managedBy)
          this.policyForm.get('inspectionSetting')?.get('elasticSearchEnabled')?.setValue(policyList[0].spec.inspection.assessment.elasticSearchEnabled ? true : false)
          if (policyList[0].spec.inspection.assessment.elasticSearchEnabled) {
            const addr = policyList[0].spec.inspection.assessment.elasticSearchAddr.split('//')

            this.policyForm.get('inspectionSetting')?.get('elasticSearchAddrHeader')?.setValue(addr[0]+'//')
            this.policyForm.get('inspectionSetting')?.get('elasticSearchAddr')?.setValue(addr[1])

            this.policyForm.get('inspectionSetting')?.get('elasticSearchUser')?.setValue(policyList[0].spec.inspection.assessment.elasticSearchUser)
            this.policyForm.get('inspectionSetting')?.get('elasticSearchPasswd')?.setValue(policyList[0].spec.inspection.assessment.elasticSearchPasswd)
            this.policyForm.get('inspectionSetting')?.get('elasticSearchCert')?.setValue(policyList[0].spec.inspection.assessment.elasticSearchCert)

          }
          this.policyForm.get('inspectionSetting')?.get('openSearchEnabled')?.setValue(policyList[0].spec.inspection.assessment.openSearchEnabled ? true : false)
          if (policyList[0].spec.inspection.assessment.openSearchEnabled) {
            const addr = policyList[0].spec.inspection.assessment.openSearchAddr.split('//')

            this.policyForm.get('inspectionSetting')?.get('openSearchAddrHeader')?.setValue(addr[0]+'//')
            this.policyForm.get('inspectionSetting')?.get('openSearchAddr')?.setValue(addr[1])

            this.policyForm.get('inspectionSetting')?.get('openSearchUser')?.setValue(policyList[0].spec.inspection.assessment.openSearchUser)
            this.policyForm.get('inspectionSetting')?.get('openSearchPasswd')?.setValue(policyList[0].spec.inspection.assessment.openSearchPasswd)
          }

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
          this.isDisabled = false
          this.policyForm.get('inspectionSetting')?.get('name')?.setValue('')
          this.policyForm.get('inspectionSetting')?.get('namespace')?.setValue('')
          this.policyForm.get('inspectionSetting')?.get('historyLimit')?.setValue(5)
          this.policyForm.get('inspectionSetting')?.get('suspend')?.setValue(false)
          this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.setValue('Forbid')
          this.policyForm.get('inspectionSetting')?.get('image')?.setValue('projects.registry.vmware.com/cnsi/inspector:0.3')
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
          this.schedule = '*/3 * * * *'
        }

        const opensearchInfo =  {
          url: policyList[0].spec.inspection.assessment.openSearchAddr,
          user: policyList[0].spec.inspection.assessment.openSearchUser,
          pswd: policyList[0].spec.inspection.assessment.openSearchPasswd
        }
        const elasticsearchInfo =  {
          url: policyList[0].spec.inspection.assessment.elasticSearchAddr,
          user: policyList[0].spec.inspection.assessment.elasticSearchUser,
          pswd: policyList[0].spec.inspection.assessment.elasticSearchPasswd,
          ca: policyList[0].spec.inspection.assessment.elasticSearchCert
        }
        
        localStorage.setItem('cnsi-open-search', window.btoa('u749VQF7hEqDTZ2y161R9J8F'+JSON.stringify(opensearchInfo)))
        localStorage.setItem('cnsi-elastic-search', window.btoa('u749VQF7hEqDTZ2y161R9J8F'+JSON.stringify(elasticsearchInfo)))

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
  createPolicy (testData?: any) {   
    this.checkES = ''
    let data:any = {}
    if (testData) { // unit test
      data = testData
    } else {
      const imagesList = this.policyForm.get('inspectionSetting')?.get('image')?.value
      data = {
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
              managedBy: this.policyForm.get('inspectionResult')?.get('managedBy')?.value,
              elasticSearchEnabled: this.policyForm.get('inspectionSetting')?.get('elasticSearchEnabled')?.value,
              openSearchEnabled: this.policyForm.get('inspectionSetting')?.get('openSearchEnabled')?.value,
            },
            baselines: this.baselines,
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
      imagesList.forEach((image: any) => {
        if (image === 'inspector') {
          data.spec.inspector.image = this.imageList[0].url
        } else if (image === 'kubebench') {
          data.spec.inspector.kubebenchImage = this.imageList[1].url
        } else if (image === 'risk') {
          data.spec.inspector.riskImage= this.imageList[2].url
        }
      });
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
    if (this.policyForm.get('inspectionSetting')?.get('elasticSearchEnabled')?.value) {
      data.spec.inspection.assessment.elasticSearchAddr = this.policyForm.get('inspectionSetting')?.get('elasticSearchAddrHeader')?.value + this.policyForm.get('inspectionSetting')?.get('elasticSearchAddr')?.value
      data.spec.inspection.assessment.elasticSearchUser = this.policyForm.get('inspectionSetting')?.get('elasticSearchUser')?.value
      data.spec.inspection.assessment.elasticSearchPasswd = this.policyForm.get('inspectionSetting')?.get('elasticSearchPasswd')?.value
      data.spec.inspection.assessment.elasticSearchCert = this.policyForm.get('inspectionSetting')?.get('elasticSearchCert')?.value
    }

    if (this.policyForm.get('inspectionSetting')?.get('openSearchEnabled')?.value) {
      data.spec.inspection.assessment.openSearchAddr = this.policyForm.get('inspectionSetting')?.get('openSearchAddrHeader')?.value + this.policyForm.get('inspectionSetting')?.get('openSearchAddr')?.value
      data.spec.inspection.assessment.openSearchUser = this.policyForm.get('inspectionSetting')?.get('openSearchUser')?.value
      data.spec.inspection.assessment.openSearchPasswd = this.policyForm.get('inspectionSetting')?.get('openSearchPasswd')?.value
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
    // const elasticSearchEnabled =this.policyForm.get('inspectionSetting')?.get('elasticSearchEnabled')?.value
    // const openSearchEnabled =this.policyForm.get('inspectionSetting')?.get('openSearchEnabled')?.value
    // this.policyInfo.spec.inspector.imagePullPolicy = this.policyForm.get('inspectionSetting')?.get('imagePullPolicy')?.value
    // this.policyInfo.spec.schedule = this.schedule
    // this.policyInfo.spec.settingsName = this.policyForm.get('inspectionSetting')?.get('settingsName')?.value
    // this.policyInfo.spec.strategy.concurrencyRule = this.policyForm.get('inspectionSetting')?.get('concurrencyRule')?.value
    // this.policyInfo.spec.strategy.historyLimit = +this.policyForm.get('inspectionSetting')?.get('historyLimit')?.value
    // this.policyInfo.spec.strategy.suspend = this.policyForm.get('inspectionSetting')?.get('suspend')?.value
    // this.policyInfo.spec.workNamespace = this.policyForm.get('inspectionSetting')?.get('namespace')?.value

    // const imagesList = this.policyForm.get('inspectionSetting')?.get('image')?.value

    // delete this.policyInfo.spec.inspector.image
    // delete this.policyInfo.spec.inspector.kubebenchImage

    // imagesList.forEach((image: any) => {
    //   if (image === 'inspector') {
    //     this.policyInfo.spec.inspector.image = this.imageList[0].url
    //   } else if (image === 'kubebench') {
    //     this.policyInfo.spec.inspector.kubebenchImage = this.imageList[1].url
    //   }
    // });
    
    // if(this.policyForm.get('inspectionResult')?.get('actions')?.value){
    //   this.policyInfo.spec.inspection.actions = []
    //   this.actions.forEach(el => {
    //     this.policyInfo.spec.inspection.actions.push({
    //       ignore: {
    //         matchExpressions: [],
    //         matchLabels: {}
    //       },
    //       kind: el.kind,
    //       settings: {}
    //     })
    //   })
    // } else {
    //   this.policyInfo.spec.inspection.actions = []
    // }
    // this.policyInfo.spec.inspection.assessment.format = this.policyForm.get('inspectionResult')?.get('format')?.value
    // this.policyInfo.spec.inspection.assessment.generate = this.policyForm.get('inspectionResult')?.get('generate')?.value
    // this.policyInfo.spec.inspection.assessment.liveTime = +this.policyForm.get('inspectionResult')?.get('liveTime')?.value
    // this.policyInfo.spec.inspection.assessment.managedBy = this.policyForm.get('inspectionResult')?.get('managedBy')?.value
    // this.policyInfo.spec.inspection.assessment.elasticSearchEnabled = elasticSearchEnabled
    // this.policyInfo.spec.inspection.assessment.openSearchEnabled = openSearchEnabled
    // this.policyInfo.spec.inspection.baselines = this.baselines
    // if (this.policyInfo.spec.inspection.namespaceSelector) {
    //   this.policyInfo.spec.inspection.namespaceSelector.matchLabels = {}
    // }
    // if (this.policyInfo.spec.inspection.workloadSelector) {
    //   this.policyInfo.spec.inspection.workloadSelector.matchLabels = {}
    // }
    // if (this.namespacelabels.length > 0) {
    //   this.namespacelabels.forEach(el => {
    //     this.policyInfo.spec.inspection.namespaceSelector.matchLabels[el.key] = el.value
    //   })
    // }
    // if (this.workloadlabels.length > 0) {
    //   this.workloadlabels.forEach(el => {
    //     this.policyInfo.spec.inspection.workloadSelector.matchLabels[el.key] = el.value
    //   })
    // }
    // if (elasticSearchEnabled) {
    //   this.policyInfo.spec.inspection.assessment.elasticSearchAddr = this.policyForm.get('inspectionSetting')?.get('elasticSearchAddrHeader')?.value + this.policyForm.get('inspectionSetting')?.get('elasticSearchAddr')?.value
    //   this.policyInfo.spec.inspection.assessment.elasticSearchUser = this.policyForm.get('inspectionSetting')?.get('elasticSearchUser')?.value
    //   this.policyInfo.spec.inspection.assessment.elasticSearchPasswd = this.policyForm.get('inspectionSetting')?.get('elasticSearchPasswd')?.value
    //   this.policyInfo.spec.inspection.assessment.elasticSearchCert = this.policyForm.get('inspectionSetting')?.get('elasticSearchCert')?.value
    // } else {
    //   delete this.policyInfo.spec.inspection.assessment.elasticSearchAddr
    //   delete this.policyInfo.spec.inspection.assessment.elasticSearchUser
    //   delete this.policyInfo.spec.inspection.assessment.elasticSearchPasswd
    //   delete this.policyInfo.spec.inspection.assessment.elasticSearchCert
    // }

    // if (openSearchEnabled) {
    //   this.policyInfo.spec.inspection.assessment.openSearchAddr = this.policyForm.get('inspectionSetting')?.get('openSearchAddrHeader')?.value + this.policyForm.get('inspectionSetting')?.get('openSearchAddr')?.value
    //   this.policyInfo.spec.inspection.assessment.openSearchUser = this.policyForm.get('inspectionSetting')?.get('openSearchUser')?.value
    //   this.policyInfo.spec.inspection.assessment.openSearchPasswd = this.policyForm.get('inspectionSetting')?.get('openSearchPasswd')?.value
    // } else {
    //   delete this.policyInfo.spec.inspection.assessment.openSearchAddr
    //   delete this.policyInfo.spec.inspection.assessment.openSearchUser
    //   delete this.policyInfo.spec.inspection.assessment.openSearchPasswd
    // }
    

    this.deletePolicy(this.policyForm.get('inspectionSetting')?.get('name')?.value)
    // this.policyService.modifyPolicy(this.policyForm.get('inspectionSetting')?.get('name')?.value, this.policyInfo).subscribe(
    //   data => {
    //     this.messageFlag = 'success'
    //     this.messageContent = 'Policy updated!'
    //     this.router.navigateByUrl('/policy')
    //   },
    //   err => {
    //     this.messageFlag = 'fail'
    //     this.messageContent = err.error.message || 'Policy updated fail!'
    //   }
    // )
    
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
  }
  saveSchedule(data:any) {
    this.schedule = data
    this.isCornUpdateModal = false
  }
  cancelSchedule() {
    this.isCornUpdateModal = false
  }
}
