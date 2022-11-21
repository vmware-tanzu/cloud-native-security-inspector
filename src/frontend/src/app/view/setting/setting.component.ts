/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
export class SettingComponent implements OnInit, OnDestroy {
  @ViewChild('corn') corn!: CornComponent;
  public secretsList: SecretModel[] = []
  public harborSetingList: any = [];
  public deleteModal = false;
  public deleteName = '';
  public createTimer!: any;
  public isCornUpdateModal = false
  public secretModalFlag = false
  public noteIconFlag = true;
  public secretForm!: UntypedFormGroup;

  public messageHarborFlag = false;
  public messageSecretFlag = ''
  public messageContent = ''

  constructor(
    private formBuilder: UntypedFormBuilder,
    private harborService: HarborService,
    public shardService: ShardService,
    private router: Router,
  ) {
    this.secretForm = this.formBuilder.group({
      secret_accessKey: ['', Validators.required],
      secret_accessSecret: ['', Validators.required],
      secret_name: ['',Validators.required], 
      secret_namespace: {value: 'default', disabled: true}
    })
  }
  ngOnDestroy(): void {
    if (this.createTimer) {
      clearInterval(this.createTimer)
    }
  }

  ngOnInit(): void {
    this.getSecrets()
    this.createTimer = setInterval(() => {
      this.getHarbor()      
    }, 1000)
  }

  // setting func
  getHarbor(){
    this.harborService.getHarborSetting().subscribe(
      data => {
        this.harborSetingList = data.items;
        this.noteIconFlag = false
        if (data.items.length < 1) {
          clearInterval(this.createTimer)
        }
        if (data.items[0].status) {
          clearInterval(this.createTimer)
          this.noteIconFlag = true;
        }

      }
    )
  }
  deleteModalHandler(name: string) {
    this.deleteModal = true
    this.deleteName = name;
  }
  deleteHarbor(){
    this.harborService.deleteHarborSetting(this.deleteName).subscribe(
      data => {
        this.getHarbor()
        this.messageHarborFlag = true;
        this.deleteModal = false;
        this.messageContent = 'Deleting app settings succeeded!'  
      },
      err => {
        this.messageHarborFlag = false;
        this.messageContent = err.error.message || 'Failed to delete app settings!'
      }
    )
  }
  modifyPolicy() {
    this.router.navigateByUrl('/modify-setting/update')
  }

  // secret func
  getSecrets() {
    this.harborService.getHarborSecretsSetting().subscribe(
      data => {
        this.secretsList = data.items
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

}
