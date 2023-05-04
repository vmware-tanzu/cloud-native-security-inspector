/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, RequiredValidator, Validators } from '@angular/forms';
import { HarborService } from '../../../service/harbor.service'
import { ShardService } from '../../../service/shard.service'
import { HarborModel, SecretModel, knownRegistrieType } from 'src/app/service/harbor-model-type';
import { ActivatedRoute, Router } from '@angular/router';
import { PolicyService } from 'src/app/service/policy.service';
@Component({
  selector: 'app-setting',
  templateUrl: './harbor-setting.componen.html',
  styleUrls: ['./harbor-setting.component.less']
})
export class HarborSettingComponent implements OnInit, OnDestroy {
  public secretsList: SecretModel[] = []
  public harborSetingList: any = [];
  public deleteModal = false;
  public deleteName = '';
  public createTimer!: any;
  public isCornUpdateModal = false
  public secretModalFlag = false
  public noteIconFlag = true;
  public secret = true
  public secretForm!: UntypedFormGroup;

  public messageHarborFlag = false;
  public messageSecretFlag = ''
  public messageContent = ''
  deleteHarborDisabled = true
  // loading
  secretLoading = false
  settingLoading = false
  constructor(
    private formBuilder: UntypedFormBuilder,
    private harborService: HarborService,
    public shardService: ShardService,
    private router: Router,
    private route: ActivatedRoute,
    private policyService: PolicyService
  ) {
    this.secretForm = this.formBuilder.group({
      secret_type: ['harbor'],
      secret_accessKey: ['', Validators.required],
      secret_accessSecret: ['', Validators.required],
      secret_name: ['',Validators.required], 
      secret_namespace: {value: 'default', disabled: true},
      secret_token: ['']
    })
  }
  ngOnDestroy(): void {
    if (this.createTimer) {
      clearInterval(this.createTimer)
    }
  }

  ngOnInit(): void {
    const secret = this.route.snapshot.queryParamMap.get('secret')
    if (secret === 'false') {
      this.isSecret = false
    } else {
      this.getSecrets()
    }
    this.createTimer = setInterval(() => {
      this.getHarbor()      
    }, 1000)
  }

  get isHarborSecret() {
    return this.secretForm.get('secret_type')?.value === 'harbor'
  }

  get isSecret () {
    return this.secret
  }

  set isSecret (value) {
    this.secret = value
  }
  // setting func
  getHarbor(){
    this.settingLoading = true
    this.harborService.getHarborSetting().subscribe(
      data => {
        this.harborSetingList = data.items;
        this.noteIconFlag = false
        if (data.items.length < 1) {
          clearInterval(this.createTimer)
        }
        if (data.items[0] && data.items[0].status) {
          clearInterval(this.createTimer)
          this.noteIconFlag = true;
        }
        this.settingLoading = false
      }
    )
  }

  // get Inspectionpolicies 
  getInspectionpolicies() {
    this.policyService.getInspectionpolicies().subscribe(
      (data: any) => {
        if (data.items.length > 0) {
          this.deleteHarborDisabled = true
          this.messageHarborFlag = true;
          this.messageContent = 'This setting is being used by the policy and cannot be deleted. Please delete the policy first and then try to delete it!'    
        } else {
          this.deleteHarborDisabled = false
        }
      },
      err => {
        console.log('err', err);
        this.deleteHarborDisabled = true
      }
    )
  }
  
  deleteModalHandler(name: string) {
    this.deleteModal = true
    this.deleteName = name;
    this.getInspectionpolicies()
  }
  deleteHarbor(){
    this.harborService.deleteHarborSetting(this.deleteName).subscribe(
      data => {
        this.getHarbor()
        this.messageHarborFlag = false;
        this.deleteModal = false;
        this.messageContent = 'Deleting app settings succeeded!'  
      },
      err => {
        this.messageHarborFlag = true;
        this.messageContent = err.error.message || 'Failed to delete app settings!'
      }
    )
  }
  modifyHarbor() {
    this.router.navigateByUrl('/modify-data-source/update')
  }

  // secret func
  getSecrets() {
    this.secretLoading = true
    this.harborService.getHarborSecretsSetting().subscribe(
      data => {
        this.secretsList = data.items
        this.secretLoading = false
      }
    )
  }

  createSecret(){
    if (!this.secretForm.get('secret_name')?.valid){
      this.messageSecretFlag='fail'
      this.messageContent = 'Check failed!'
      return 
    }
    const secret: SecretModel = {
      data: {
      },
      kind: 'Secret',
      metadata: {
        name: this.secretForm.get('secret_name')?.value,
        namespace: this.secretForm.get('secret_namespace')?.value,
        annotations: {
          type: this.secretForm.get('secret_type')?.value
        }
      },
      type: 'Opaque'
    }

    if (this.secretForm.get('secret_type')?.value === 'harbor') {
      secret.data.accessKey = window.btoa(this.secretForm.get('secret_accessKey')?.value),
      secret.data.accessSecret = window.btoa(this.secretForm.get('secret_accessSecret')?.value)
    } else {
      secret.data.API_TOKEN = window.btoa(this.secretForm.get('secret_token')?.value)
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

}
