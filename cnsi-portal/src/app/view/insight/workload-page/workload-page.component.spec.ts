/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module'
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

import { WorkloadPageComponent } from './workload-page.component';
import { of } from 'rxjs';
import { AssessmentService } from 'src/app/service/assessment.service';

describe('WorkloadPageComponent', () => {
  let component: WorkloadPageComponent;
  let fixture: ComponentFixture<WorkloadPageComponent>;
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
      declarations: [ WorkloadPageComponent ],
      imports: [ShardTestModule],
      providers: [PolicyService, ShardService, AssessmentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkloadPageComponent);
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
      component.showDetail({
        target: {
          classList: ['report-detai-bg']
        }
      })
      component.toWorkload({namespace: '', workload: ''})
      component.testMousedown({clientX: 777})
      component.testMousemove({clientX: 777})
      component.testMouseup({clientX: 777})  
    })

  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
