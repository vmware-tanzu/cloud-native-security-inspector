/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ShardService } from 'src/app/service/shard.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

import { ReportViewComponent } from './report-view.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { of } from 'rxjs';

describe('ReportViewComponent', () => {
  let component: ReportViewComponent;
  let fixture: ComponentFixture<ReportViewComponent>;
  let assessmentService: AssessmentService
  const cnsiServiceStub = {
    getKubeBenchReport: () => {
      return of({
        hits: {
          "total": {
            "value": 2
          },
          hits: [{
            _source: {
              failures: "[]"
            },
            createTime: '2023-02-22T05:50:03Z'
          }]
        }
      })
    }
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportViewComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [ShardService, PolicyService, AssessmentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    assessmentService = TestBed.inject(AssessmentService);
    localStorage.setItem('cnsi-open-search', 'dTc0OVZRRjdoRXFEVFoyeTE2MVI5SjhGeyJ1cmwiOiJodHRwczovL29wZW5zZWFyY2gtY2x1c3Rlci1tYXN0ZXIub3BlbnNlYXJjaDo5MjAwIiwidXNlciI6ImFkbWluIiwicHN3ZCI6ImFkbWluIn0=')
    localStorage.setItem('cnsi-elastic-search', 'dTc0OVZRRjdoRXFEVFoyeTE2MVI5SjhGeyJ1cmwiOiJodHRwczovL29wZW5zZWFyY2gtY2x1c3Rlci1tYXN0ZXIub3BlbnNlYXJjaDo5MjAwIiwidXNlciI6ImFkbWluIiwicHN3ZCI6ImFkbWluIn0=')
  });

  describe('functions ', () => {

    it('get all data', fakeAsync(() => {
      spyOn(assessmentService, 'getKubeBenchReport').and.returnValue(
        cnsiServiceStub.getKubeBenchReport()
      );
      
      fixture.detectChanges();
      // expect(policyService.getInspectionpolicies).toHaveBeenCalled();

      component.getAssessmentreports();
      tick(1500);
      // expect(assessmentService.getKubeBenchReport);

    }));

    it('other test', () => {
      const report = {
        _source: {
          actionEnforcement: "[]",
          failures: "[]",
          inspectionConfiguration: '{"namespaceSelector": {"matchLabels": [{"key": "kubernetes.io/metadata.name","value": "default"}]}}'
        }
      }
      component.toReport(report)

      component.pagination = {
        page: {
          size: 10
        }
      }
      component.pageChange({
        "page": {
            "from": 0,
            "to": 1,
            "size": 20,
            "current": 1
          }
      });

      component.getKubeBenchReportList({
        "value": "Kubernetes Policies",
        "key": "text",
        "reset": true
      })

      component.getKubeBenchReportList({
        "value": "Worker Node Security Configuration",
        "key": "text",
        "reset": true
      })

      component.getKubeBenchReportListQuery = {
        "size": 1,
        "from": 0,
        "sort": [
            {
                "createTime": {
                    "order": "desc"
                }
            }
        ],
        "query": {
            "match": {
                "text": "Worker Node Security Configuration"
            }
        }
      }
      component.getKubeBenchReportListFilter = {
        "value": "Worker Node Security Configuration",
        "key": "text",
        "reset": true
      }
      component.getKubeBenchReportListCallBack({
        "hits": {
            "total": {
                "value": 2,
            },
            "hits": []
        }
      }, component)

      component.getKubeBenchReportListFilter = {
        "value": "Worker Node Security Configuration",
        "key": "text",
        "reset": false
      }

      component.getKubeBenchReportListCallBack({
        "hits": {
            "total": {
                "value": 10,
            },
            "hits": [{
              _source: {},
              createTime: '2023-02-22T05:50:03Z'
            }]
        }
      }, component)

      component.createTimeSortCallBack({
        "hits": {
            "hits": []
        }
    }, component)

    component.showDetail({
      target: {
        classList: ['report-detai-bg']
      }
    })
    component.createTimeSort()

    component.createTimeSort()


    component.echartsRender([2,3,4],[1,2,3])

    component.testMousedown({clientX: 777})
    component.testMousemove({clientX: 777})
    component.testMouseup({clientX: 777})
  });

});

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
