/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { InspectionPolicyType } from 'src/app/service/policy-model-type';
import { PolicyService } from 'src/app/service/policy.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { PolicyComponent } from './policy.component';

describe('PolicyComponent', () => {
  let component: PolicyComponent;
  let fixture: ComponentFixture<PolicyComponent>;
  let policyService: PolicyService
  const vmcServiceStub = {
    getInspectionpolicies() {
      return of({apiVersion: '',
        items: [],
        kind: '',
        metadata: {
          continue: '',
          remainingItemCount: 0,
          resourceVersion: '',
          selfLink: ''
        }});
    },
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicyComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    policyService = TestBed.inject(PolicyService);
  });

  describe('functions ', () => {
    it('get inspectionpolicies', () => {
      // component.modifyPolicy()
      component.deleteModalHandler('test')
      component.deletePolicy()
  
    });

    it('get all Inspection Policies', fakeAsync(() => {
      component.getInspectionpolicies();
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        vmcServiceStub.getInspectionpolicies()
      );
      fixture.detectChanges();
      // expect(policyService.getInspectionpolicies).toHaveBeenCalled();
      tick(1500);
      expect(policyService.getInspectionpolicies);
    }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
