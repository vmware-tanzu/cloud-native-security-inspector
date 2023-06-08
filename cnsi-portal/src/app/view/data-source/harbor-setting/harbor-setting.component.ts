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
    this.getHarbor()
    this.createTimer = setInterval(() => {
      this.getHarbor()      
    }, 3000)
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
        this.messageContent = err.error?.message || 'Failed to delete app settings!'
      }
    )
  }
  modifyHarbor() {
    this.router.navigateByUrl('/modify-data-source/update')
  }
}
