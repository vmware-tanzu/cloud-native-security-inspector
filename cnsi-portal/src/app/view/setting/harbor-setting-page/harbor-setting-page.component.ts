import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HarborModel, knownRegistrieType, SecretModel } from 'src/app/service/harbor-model-type';
import { HarborService } from 'src/app/service/harbor.service';
import { ShardService } from 'src/app/service/shard.service';

@Component({
  selector: 'app-harbor-setting-page',
  templateUrl: './harbor-setting-page.component.html',
  styleUrls: ['./harbor-setting-page.component.less']
})
export class HarborSettingPageComponent implements OnInit {
  public schedule="0 0 * * *"
  public createButtonFlag = true
  public messageHarborFlag = ''
  public messageSecretFlag = ''
  public messageContent = ''
  public text = ''
  public updateDisabled = false
  public isCornUpdateModal = false
  public secretsList: SecretModel[] = []

  createTimer!: any
  harborForm!: UntypedFormGroup;
  harborResponse!:HarborModel
  knownRegistries:knownRegistrieType[] = [
    // {
    //   credentialRef : {
    //     name: '',
    //     namespace: 'default',
    //   },
    //   endpoint: '',
    //   name: '',
    //   provider: 'docker-registry',
    //   skipTLSVerify: false
    // }
  ]
  knownRegistriesProviderList = ["li-acr","artifact-hub","aws-ecr","azure-acr","docker-hub","docker-registry","dtr","github-ghcr","gitlab","google-gcr","harbor","helm-hub","huawei-SWR","jfrog-artifactory","quay","tencent-tcr"]

  constructor(
    private formBuilder: UntypedFormBuilder,
    private harborService: HarborService,
    public shardService: ShardService,
    private router: Router,
    private route: ActivatedRoute

  ) { 
    this.harborForm = this.formBuilder.group({
      requiredFields: this.formBuilder.group({
        name: ['',Validators.required],
        data_credential_name: ['',Validators.required],
        data_credential_namespace: {value: 'default', disabled: true},
        data_provider: {value: 'Harbor', disabled: true},
        protocol: 'http://',
        data_endpoint: ['demo.goharbor.io'],
        data_skipTLSVerify: [false]
      }),
      knownRegistries: this.formBuilder.group({

      }),
      cache: this.formBuilder.group({
        address: [''],
        livingTime: [0],
        setting_skipTLSVerify: [true],
      })
    })
  }

  get dataSourceName() {
    return this.harborForm.get('requiredFields')?.get('name')?.value + '-' + this.harborForm.get('requiredFields')?.get('data_endpoint')?.value
  }

  get requiredFieldsValid() {
    let result = true
    const data = this.harborForm.get('requiredFields')?.value
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

  get cacheValid() {
    return false
  }
  get knownRegistriesValid() {
    return false
  }
  ngOnInit(): void {
    this.route.params.subscribe(
      data => {
        this.text = data.id
        if (!this.text) {
          this.router.navigateByUrl('/setting')
        }
      }
    )
    this.getSecrets()
    this.getHarbor()
  }

  saveSchedule(data:any) {
    this.schedule = data
    this.isCornUpdateModal = false
  }
  cancelSchedule() {
    this.isCornUpdateModal = false
  }

  knownRegistriesremoveItem(i: number) {
    this.knownRegistries.splice(i, 1)
  }

  knownRegistriesAddItem() {
    this.knownRegistries.push({
        credentialRef : {
          name: '',
          namespace: 'default',
        },
        endpoint: '',
        name: '',
        provider: 'docker-registry',
        skipTLSVerify: false
      })
  }
  // http
  getSecrets() {
    this.harborService.getHarborSecretsSetting().subscribe(
      data => {
        this.secretsList = data.items
      }
    )
  }

  getHarbor(){
    this.harborService.getHarborSetting().subscribe(
      data => {
        if (data.items && data.items.length > 0) {
          this.createButtonFlag = false
          this.harborResponse = data.items[0]
          this.harborForm.get('requiredFields')?.get('name')?.setValue(this.harborResponse.metadata.name)
          this.harborForm.get('requiredFields')?.get('data_credential_name')?.setValue(this.harborResponse.spec.dataSource.credentialRef.name)
          this.harborForm.get('requiredFields')?.get('data_credential_namespace')?.setValue(this.harborResponse.spec.dataSource.credentialRef.namespace)
          this.harborForm.get('requiredFields')?.get('data_provider')?.setValue(this.harborResponse.spec.dataSource.provider)
          const endpoint = this.harborResponse.spec.dataSource.endpoint
          const temporary = endpoint.split('://')
          this.harborForm.get('requiredFields')?.get('protocol')?.setValue(temporary[0]+'://')
          this.harborForm.get('requiredFields')?.get('data_endpoint')?.setValue(temporary[1])
          this.harborForm.get('requiredFields')?.get('data_skipTLSVerify')?.setValue(this.harborResponse.spec.dataSource.skipTLSVerify)
          this.harborForm.get('cache')?.get('address')?.setValue(this.harborResponse.spec.cache?.address)
          this.harborForm.get('cache')?.get('livingTime')?.setValue(this.harborResponse.spec.cache?.settings.livingTime)
          this.harborForm.get('cache')?.get('setting_skipTLSVerify')?.setValue(this.harborResponse.spec.cache?.settings.skipTLSVerify)          
          if (this.harborResponse.spec.knownRegistries && this.harborResponse.spec.knownRegistries.length > 0) {            
            this.knownRegistries = this.harborResponse.spec.knownRegistries
          }
          this.schedule = this.harborResponse.spec.dataSource.scanSchedule.slice(1)
          if (this.harborResponse.status) {
            // this.settingStatus = this.harborResponse.status.status || ''
          }
        } else {
          this.createButtonFlag = true
          this.harborForm.get('requiredFields')?.get('name')?.setValue('')
          this.harborForm.get('requiredFields')?.get('data_credential_name')?.setValue('')
          this.harborForm.get('requiredFields')?.get('data_credential_namespace')?.setValue('default')
          this.harborForm.get('requiredFields')?.get('data_provider')?.setValue('Harbor')
          this.harborForm.get('requiredFields')?.get('protocol')?.setValue('http://')
          this.harborForm.get('requiredFields')?.get('data_endpoint')?.setValue('demo.goharbor.io')
          this.harborForm.get('requiredFields')?.get('data_skipTLSVerify')?.setValue(false)
          this.harborForm.get('cache')?.get('address')?.setValue('')
          this.harborForm.get('cache')?.get('livingTime')?.setValue(0)
          this.harborForm.get('cache')?.get('setting_skipTLSVerify')?.setValue(true)
          this.knownRegistries = []
          this.schedule = "0 0 * * *"
        }
      }
    )
  }

  harborHandler(text: string) {
    if (text === 'update') {
      this.updateHarbor()
    } else {
      this.createHarbor()
    }
  }

  createHarbor(){
    const data: HarborModel = {
      apiVersion: 'goharbor.goharbor.io/v1alpha1',
      kind: 'Setting',
      metadata: {
        name: this.harborForm.get('requiredFields')?.get('name')?.value
      },
      spec: {
        dataSource: {
          credentialRef: {
            name: this.harborForm.get('requiredFields')?.get('data_credential_name')?.value,
            namespace: this.harborForm.get('requiredFields')?.get('data_credential_namespace')?.value,
          },
          endpoint: this.harborForm.get('requiredFields')?.get('protocol')?.value + this.harborForm.get('requiredFields')?.get('data_endpoint')?.value,
          name: this.dataSourceName,
          provider: 'Harbor',
          scanSchedule: `0 ${this.schedule.trim()}`,
          skipTLSVerify: this.harborForm.get('requiredFields')?.get('data_skipTLSVerify')?.value,
        },
      },
      status: {}
    }
    if (this.harborForm.get('cache')?.get('address')?.value && this.harborForm.get('cache')?.get('livingTime')?.value) {
      data.spec.cache ={
        address: this.harborForm.get('cache')?.get('address')?.value,
        kind: 'Redis',
        settings: {
          livingTime: this.harborForm.get('cache')?.get('livingTime')?.value,
          skipTLSVerify: this.harborForm.get('cache')?.get('setting_skipTLSVerify')?.value
        }
      }
    }

    if (this.knownRegistries[0]) {
      data.spec.knownRegistries=this.knownRegistries
    }

    this.harborService.postHarborSetting(data).subscribe(
      data => {
        this.messageHarborFlag = 'success'
        this.messageContent = 'Settings created and applied successfully!' 
        this.updateDisabled = true   
        this.createButtonFlag = false
        this.router.navigate(
          ['/setting'],
          { queryParams: { secret: false } }
        );
      },
      err => {
        this.messageHarborFlag = 'fail'
        this.messageContent = err.error.message || 'Failed to create and apply settings!'
      }
    )
  }
  updateHarbor(){
    // harbor update
    if (!this.harborResponse) return
    this.harborResponse.metadata.name = this.harborForm.get('requiredFields')?.get('name')?.value
    this.harborResponse.spec.dataSource.credentialRef.name = this.harborForm.get('requiredFields')?.get('data_credential_name')?.value
    this.harborResponse.spec.dataSource.credentialRef.namespace = this.harborForm.get('requiredFields')?.get('data_credential_namespace')?.value
    this.harborResponse.spec.dataSource.endpoint = this.harborForm.get('requiredFields')?.get('protocol')?.value + this.harborForm.get('requiredFields')?.get('data_endpoint')?.value
    this.harborResponse.spec.dataSource.name = this.dataSourceName
    this.harborResponse.spec.dataSource.scanSchedule = `0 ${this.schedule.trim()}`
    this.harborResponse.spec.dataSource.skipTLSVerify = this.harborForm.get('requiredFields')?.get('data_skipTLSVerify')?.value
    this.harborResponse.spec.knownRegistries = this.knownRegistries
    if (this.harborForm.get('cache')?.get('address')?.value && this.harborForm.get('cache')?.get('livingTime')?.value) {
      this.harborResponse.spec.cache = {
        address: '',
        kind: 'Redis',
        settings: {
          livingTime: 0,
          skipTLSVerify: false
        }
      }
      this.harborResponse.spec.cache.address = this.harborForm.get('cache')?.get('address')?.value 
      this.harborResponse.spec.cache.settings.livingTime = +this.harborForm.get('cache')?.get('livingTime')?.value 
      this.harborResponse.spec.cache.settings.skipTLSVerify = this.harborForm.get('cache')?.get('setting_skipTLSVerify')?.value 
    }
    this.harborService.updateHarborSetting(this.harborResponse.metadata.name, this.harborResponse).subscribe(
      data => {
        this.messageHarborFlag = 'success'
        this.messageContent = 'Update and apply settings successfully!' 
        this.router.navigate(
          ['/setting'],
          { queryParams: { secret: false } }
        );
      },
      err => {
        this.messageHarborFlag = 'fail'
        this.messageContent = err.error.message || 'Failed to update and apply settings!'
      }
    )
  }

}
