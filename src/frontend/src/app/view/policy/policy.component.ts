/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'
import { ActivatedRoute, Router } from '@angular/router'
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { PolicyService } from 'src/app/service/policy.service';
import { HarborService } from 'src/app/service/harbor.service';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.less']
})
export class PolicyComponent implements OnInit {
  public noteIconFlag = true;
  public messageFlag = false;
  public deleteModal = false;
  policyLoading = false
  public messageContent = '';
  public deleteName = '';

  public policyList: any[] = [];

  constructor(
    public shardService:ShardService,
    private policyService: PolicyService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.getInspectionpolicies()
  }

  modifyPolicy() {
    this.router.navigateByUrl('/modify-policy/update')
  }

  deleteModalHandler(name: string) {
    this.deleteModal = true
    this.deleteName = name;
  }

  deletePolicy () {
    this.policyService.deletePolicy(this.deleteName).subscribe(
      data => {
        this.getInspectionpolicies()
        this.deleteModal = false
      },
      err => {
        this.messageFlag = true
        this.messageContent = err.error.message || 'Policy deleted fail!'
      }
    )

  }

  getInspectionpolicies() {
    this.policyLoading = true
    this.policyService.getInspectionpolicies().subscribe(
      (data: any) => {
        this.policyList = data.items
        if (this.policyList.length > 0) {
          const opensearchInfo =  {
            url: this.policyList[0].spec.inspection.assessment.openSearchAddr,
            user: this.policyList[0].spec.inspection.assessment.openSearchUser,
            pswd: this.policyList[0].spec.inspection.assessment.openSearchPasswd
          }
          const elasticsearchInfo =  {
            url: this.policyList[0].spec.inspection.assessment.elasticSearchAddr,
            user: this.policyList[0].spec.inspection.assessment.elasticSearchUser,
            pswd: this.policyList[0].spec.inspection.assessment.elasticSearchPasswd,
            ca: this.policyList[0].spec.inspection.assessment.elasticSearchCert
          }
          localStorage.setItem('cnsi-open-search', window.btoa('u749VQF7hEqDTZ2y161R9J8F'+JSON.stringify(opensearchInfo)))
          localStorage.setItem('cnsi-elastic-search', window.btoa('u749VQF7hEqDTZ2y161R9J8F'+JSON.stringify(elasticsearchInfo)))
        }
        this.policyLoading = false
      },
      err => {
        console.log('err', err);
      }
    )
  }
}
