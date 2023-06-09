/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { ReportViewDetailComponent } from './report-view-detail.component';

describe('ReportViewDetailComponent', () => {
  let component: ReportViewDetailComponent;
  let fixture: ComponentFixture<ReportViewDetailComponent>;
  let policyService: PolicyService

  const fakeActivatedRoute = {
    snapshot: { data: {} }
  } as ActivatedRoute;
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
    getInspectionpolicies2() {
      return of({apiVersion: '',
        items: [
          {
            spec: {
              vacAssessmentEnabled: true
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
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportViewDetailComponent ],
      imports: [ShardTestModule],
      providers: [ShardService, PolicyService ,{provide: ActivatedRoute, useValue: fakeActivatedRoute}],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportViewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    policyService = TestBed.inject(PolicyService);
  });
  describe('functions ', () => {
    it('other test', () => {
      component.showDetail({})
      component.showContainerVAC({})
    })

    it('get all Inspection Policies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        vmcServiceStub.getInspectionpolicies()
      );
      fixture.detectChanges();
      tick(1500);
      component.init();

      expect(policyService.getInspectionpolicies);
    }));

    it('get all Inspection Policies2', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        vmcServiceStub.getInspectionpolicies2()
      );
      fixture.detectChanges();
      tick(1500);
      component.init();

      expect(policyService.getInspectionpolicies);
    }));
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
