/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HarborService } from 'src/app/service/harbor.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { HarborSettingComponent } from './harbor-setting.component';

describe('HarborSettingComponent', () => {
  let component: HarborSettingComponent;
  let fixture: ComponentFixture<HarborSettingComponent>;
  let harborService: HarborService
  let policyService: PolicyService

  const vmcServiceStub = {
    getHarborSetting0() {
      return of({
        items: []
      });
    },
    getHarborSetting1() {
      return of({
        items: [{
          metadata: {
            name: '',
          },
          spec: {
            dataSource: {
              credentialRef: {
                name: '',
                namespace: '',
              },
              endpoint: '',
              name: '',
              provider: 'Harbor',
              scanSchedule: '',
              skipTLSVerify: true
            }
          },
          status: {
            status: ''
          }
        }]
      });
    },
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
    deleteHarborSetting(deleteName: string) {
      return of({
        apiVersion: '',
        items: [],
        kind: '',
        metadata: {
          continue: '',
          remainingItemCount: 0,
          resourceVersion: '',
          selfLink: ''
        }
      })
    },
    deleteHarborSettingError(deleteName: string) {
      return throwError(deleteName)
    }

  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HarborSettingComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [ShardService, HarborService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HarborSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    harborService = TestBed.inject(HarborService);
    policyService = TestBed.inject(PolicyService);

  });

  describe('functions ', () => {
    it('getHarborSetting length == 0', fakeAsync(() => {
      spyOn(harborService, 'getHarborSetting').and.returnValue(
        vmcServiceStub.getHarborSetting0()
      );
      fixture.detectChanges();
      tick(500);
      component.getHarbor();
      expect(harborService.getHarborSetting);
      flush()
    }));

    it('getHarborSetting length == 1', fakeAsync(() => {
      spyOn(harborService, 'getHarborSetting').and.returnValue(
        vmcServiceStub.getHarborSetting1()
      );
      fixture.detectChanges();
      tick(500);
      component.getHarbor();
      expect(harborService.getHarborSetting);
      flush()
    }));

    it('deleteModalHandler', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        vmcServiceStub.getInspectionpolicies()
      );
      fixture.detectChanges();
      tick(500);
      component.deleteModalHandler('test');
      expect(policyService.getInspectionpolicies);
      flush()
    }));

    it('getInspectionpolicies Error', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        vmcServiceStub.getInspectionpoliciesError()
      );
      fixture.detectChanges();
      tick(500);
      component.getInspectionpolicies();
      expect(policyService.getInspectionpolicies);
      flush()
    }));

    it('deleteHarbor', fakeAsync(() => {
      spyOn(harborService, 'deleteHarborSetting').and.returnValue(
        vmcServiceStub.deleteHarborSetting(component.deleteName)
      );
      fixture.detectChanges();
      tick(2000);
      component.deleteHarbor()
      expect(harborService.deleteHarborSetting);
      flush()
    }));

    it('deleteHarbor Error', fakeAsync(() => {
      spyOn(harborService, 'deleteHarborSetting').and.returnValue(
        vmcServiceStub.deleteHarborSettingError(component.deleteName)
      );
      fixture.detectChanges();
      tick(2100);
      component.deleteHarbor()
      expect(harborService.deleteHarborSetting);
      flush()
    }));
    it('modifyHarbor', () => {
      component.modifyHarbor()
    });

  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
