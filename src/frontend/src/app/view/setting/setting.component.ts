/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, RequiredValidator, Validators } from '@angular/forms';
import { CornComponent } from '../corn/corn.component';
import { HarborService } from '../../service/harbor.service'
import { ShardService } from '../../service/shard.service'
import { HarborModel, SecretModel, knownRegistrieType } from 'src/app/service/harbor-model-type';
import { Router } from '@angular/router';
@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.less']
})
export class SettingComponent implements OnInit {
  @ViewChild('corn') corn!: CornComponent;
  schedule="0 0 * * *"
  policy = false
  harbor = true
  harborResponse!:HarborModel
  secretsResponse!:SecretModel
  createButtonFlag = true
  isCornUpdateModal = false
  secretModalFlag = false
  knownRegistriesProviderList = ["li-acr","artifact-hub","aws-ecr","azure-acr","docker-hub","docker-registry","dtr","github-ghcr","gitlab","google-gcr","harbor","helm-hub","huawei-SWR","jfrog-artifactory","quay","tencent-tcr"]
  harborForm!: UntypedFormGroup;
  policyForm!: UntypedFormGroup;
  secretForm!: UntypedFormGroup;
  secretsList: SecretModel[] = []
  createTimer!: any
  updateDisabled = false
  knownRegistries:knownRegistrieType[] = [
    {
      credentialRef : {
        name: '',
        namespace: 'default',
      },
      endpoint: '',
      name: '',
      provider: 'docker-registry',
      skipTLSVerify: false
    }
  ]
  public messageHarborFlag = ''
  public messageSecretFlag = ''
  public messageContent = ''
  public settingStatus = ''
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

  get knownRegistriesValid() {
    return false
  }

  get cacheValid() {
    return false
  }

  constructor(
    private formBuilder: UntypedFormBuilder,
    private harborService: HarborService,
    public shardService: ShardService,
    private router: Router
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
    this.secretForm = this.formBuilder.group({
      secret_accessKey: ['', Validators.required],
      secret_accessSecret: ['', Validators.required],
      secret_name: ['',Validators.required], 
      secret_namespace: {value: 'default', disabled: true}
    })
  }

  ngOnInit(): void {
    this.getHarbor()
    this.getSecrets()
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
            this.settingStatus = this.harborResponse.status.status || ''
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
          this.knownRegistries = [
            {
              credentialRef : {
                name: '',
                namespace: 'default',
              },
              endpoint: '',
              name: '',
              provider: 'docker-registry',
              skipTLSVerify: false
            }
          ]
          this.schedule = "0 0 * * *"
        }
      }
    )
  }

  getSecrets() {
    this.harborService.getHarborSecretsSetting().subscribe(
      data => {
        this.secretsList = data.items
      }
    )
  }
  knownRegistriesAddItem() {
    this.knownRegistries.push({
      credentialRef : {
        name: '',
        namespace: '',
      },
      endpoint: '',
      name: '',
      provider: 'docker-registry',
      skipTLSVerify: false
    })
  }

  knownRegistriesremoveItem(i: number) {
    this.knownRegistries.splice(i, 1)
  }
  saveSchedule(data:any) {
    this.schedule = data
    this.isCornUpdateModal = false
  }
  cancelSchedule(data:any) {
    this.isCornUpdateModal = false
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
          scanSchedule: `0 ${this.schedule}`,
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

    if (this.knownRegistries[0].name) {
      data.spec.knownRegistries=this.knownRegistries
    }

    this.harborService.postHarborSetting(data).subscribe(
      data => {
        this.messageHarborFlag = 'success'
        this.messageContent = 'Settings created and applied successfully!' 
        this.updateDisabled = true   
        this.createButtonFlag = false

        this.createTimer = setInterval(() => {
          this.harborService.getHarborSetting().subscribe(
            data => {
              if (data.items[0].status) {
                clearInterval(this.createTimer)
                this.harborResponse = data.items[0]
                this.updateDisabled = false
              }
            })  
          
        }, 500)
      },
      err => {
        this.messageHarborFlag = 'fail'
        this.messageContent = err.error.message || 'Failed to create and apply settings!'
      }
    )
  }
  updateHarbor(){
    // harbor update

    this.harborResponse.metadata.name = this.harborForm.get('requiredFields')?.get('name')?.value
    this.harborResponse.spec.dataSource.credentialRef.name = this.harborForm.get('requiredFields')?.get('data_credential_name')?.value
    this.harborResponse.spec.dataSource.credentialRef.namespace = this.harborForm.get('requiredFields')?.get('data_credential_namespace')?.value
    this.harborResponse.spec.dataSource.endpoint = this.harborForm.get('requiredFields')?.get('protocol')?.value + this.harborForm.get('requiredFields')?.get('data_endpoint')?.value
    this.harborResponse.spec.dataSource.name = this.dataSourceName
    this.harborResponse.spec.dataSource.scanSchedule = `0 ${this.schedule}`
    
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
        this.getHarbor() 
      },
      err => {
        this.messageHarborFlag = 'fail'
        this.messageContent = err.error.message || 'Failed to update and apply settings!'
      }
    )
  }
  deleteHarbor(){
    this.harborService.deleteHarborSetting(this.harborResponse.metadata.name).subscribe(
      data => {
        this.messageHarborFlag = 'success'
        this.messageContent = 'Deleting app settings succeeded!'  
        this.reloadCurrentRoute()  
      },
      err => {
        this.messageHarborFlag = 'fail'
        this.messageContent = err.error.message || 'Failed to delete app settings!'
      }
    )
  }
  createSecret(){
    if (!this.secretForm.valid){
      this.messageSecretFlag='fail'
      this.messageContent = 'Check failed!'
      return 
    }
    const secret: SecretModel = {
      apiVersion: 'v1',
      data: {
        accessKey: window.btoa(this.secretForm.get('secret_accessKey')?.value),
        accessSecret: window.btoa(this.secretForm.get('secret_accessSecret')?.value)
      },
      kind: 'Secret',
      metadata: {
        name: this.secretForm.get('secret_name')?.value,
        namespace: this.secretForm.get('secret_namespace')?.value
      },
      type: 'Opaque'
    }
    this.harborService.postHarborSecretsSetting(secret.metadata.namespace, secret).subscribe(
      data => {
        this.messageSecretFlag = 'success'
        this.secretModalFlag=false
        this.getSecrets()
      },
      err => {
        this.messageSecretFlag = 'fail'
        this.messageContent = err.error.message || 'Secret created fail!'
      }
    )
  }

  //reloadCurrentRoute is to reload current page
  reloadCurrentRoute() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}
