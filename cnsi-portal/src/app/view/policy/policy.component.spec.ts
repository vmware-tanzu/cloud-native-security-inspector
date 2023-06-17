/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { throwError, of } from 'rxjs';
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
        items: [
          {
            spec: {
              inspector: {
                exportConfig: {
                  openSearch: {
                    hostport: '127.0.0.1',
                    username: 'admin',
                    password: 'admin'
                  }
                }
              }
            }
          }
        ],
        kind: '',
        metadata: {
          continue: '',
          remainingItemCount: 0,
          resourceVersion: '',
          selfLink: ''
        }});
    },
    getInspectionpoliciesError() {
      return throwError('test')
    },
    deletePolicy(deleteName: string) {
      return of({})
    },
    deletePolicyError(deleteName: string) {
      return throwError(deleteName)
    }

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
      component.deleteModalHandler('test')  
    });

    it('get all Inspection Policies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        vmcServiceStub.getInspectionpolicies()
      );
      fixture.detectChanges();
      // expect(policyService.getInspectionpolicies).toHaveBeenCalled();
      tick(1500);
      component.getInspectionpolicies();

      expect(policyService.getInspectionpolicies);
      flush()
    }));

    it('delete Inspection Policy', fakeAsync(() => {
      component.deleteName = 'test'
      spyOn(policyService, 'deletePolicy').and.returnValue(
        vmcServiceStub.deletePolicy(component.deleteName)
      );
      fixture.detectChanges();
      tick(1500);
      component.deletePolicy();

      expect(policyService.deletePolicy);
      flush()
    }));

    it('return throw policy', fakeAsync(() => {
      component.deleteName = 'test'
      spyOn(policyService, 'deletePolicy').and.returnValue(
        vmcServiceStub.deletePolicyError(component.deleteName)
      );
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        vmcServiceStub.getInspectionpoliciesError()
      );
      fixture.detectChanges();
      tick(1500);
      component.getInspectionpolicies();
      component.deletePolicy()
      expect(policyService.getInspectionpolicies)
      flush()
    }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
