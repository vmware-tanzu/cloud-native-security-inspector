/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { ClusterPageComponent } from './cluster-page.component';
import { ShardTestModule } from 'src/app/shard/shard/shard.module'
import { ShardService } from 'src/app/service/shard.service'
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { AssessmentService } from 'src/app/service/assessment.service';
import { of } from 'rxjs';

describe('ClusterPageComponent', () => {
  let component: ClusterPageComponent;
  let fixture: ComponentFixture<ClusterPageComponent>;
  let assessmentService : AssessmentService

  const cnsiServiceStub = {
    getKubeBenchReport: () => {
      return of({
        hits: {
          "total": {
            "value": 2
          },
          hits: [{
            _source: {
              failures: "[]",
              timeStamp: '2023-02-22T05:50:03Z',
              namespaceAssessments: [{
                namespace: {
                  name: 'test'
                },
                workloadAssessments: [{
                  pass: false,
                  failures: [{}],
                  workload: {
                    metadata: {
                      kind: 'Deployment'
                    }
                  }
                }]
              }]
            },
            createTime: '2023-02-22T05:50:03Z'
          }]
        }
      })
    }
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClusterPageComponent ],
      imports: [ShardTestModule],
      providers: [AssessmentService, ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    assessmentService = TestBed.inject(AssessmentService);
    localStorage.setItem('cnsi-open-search', 'dTc0OVZRRjdoRXFEVFoyeTE2MVI5SjhGeyJ1cmwiOiJodHRwczovL29wZW5zZWFyY2gtY2x1c3Rlci1tYXN0ZXIub3BlbnNlYXJjaDo5MjAwIiwidXNlciI6ImFkbWluIiwicHN3ZCI6ImFkbWluIn0=')
  });

  describe('functions ', () => {
    it('getKubeBenchReport', fakeAsync(() => {
      spyOn(assessmentService, 'getKubeBenchReport').and.returnValue(
        cnsiServiceStub.getKubeBenchReport()
      );
      component.packedbubble = {
        getSeries: () => {}
      } as any
      component.shardService.namespaceList = [{name: 'test'}] as any[]
      component.shardService.namespacChartLineOption = {
        xAxis: ['test'],
        series: [{
          data: [0]
        }]
      }
      fixture.detectChanges();
      component.getNewReport()
      // expect(policyService.getInspectionpolicies).toHaveBeenCalled();

      tick(1500);
      // expect(assessmentService.getKubeBenchReport);

    }));
    
    it('should create',() => {
      component.summaryFlag = true
      component.violationsFlag = true
    })

  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
