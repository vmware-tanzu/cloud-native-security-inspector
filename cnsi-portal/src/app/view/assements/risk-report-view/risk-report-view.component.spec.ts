import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AssessmentService } from 'src/app/service/assessment.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { RiskReportViewComponent } from './risk-report-view.component';

describe('RiskReportViewComponent', () => {
  let component: RiskReportViewComponent;
  let fixture: ComponentFixture<RiskReportViewComponent>;
  let policyService: PolicyService
  let assessmentService: AssessmentService
  const cnsiServiceStub = {
    getInspectionpolicies1: () => {
      return of({
        items: [{
          spec: {
            inspector: {}
          }
        }]
      })
    },
    getInspectionpolicies2: () => {
      return of({
        items: []
      })
    },
    getInspectionpolicies3: () => {
      return of({
        items: [{
          spec: {
            inspector: {
              riskImage: 'test'
            }
          }
        }]
      })
    },
    getInspectionpoliciesError: () => {
      return throwError('tets')
    },
    getKubeBenchReport: () => {
      return of({
        hits: {
          total: 10
        }
      })
    }

  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportViewComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [AssessmentService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskReportViewComponent);
    policyService = TestBed.inject(PolicyService);
    assessmentService = TestBed.inject(AssessmentService);
    component = fixture.componentInstance;
    fixture.detectChanges();
    localStorage.setItem('cnsi-open-search', 'dTc0OVZRRjdoRXFEVFoyeTE2MVI5SjhGeyJ1cmwiOiJodHRwczovL29wZW5zZWFyY2gtY2x1c3Rlci1tYXN0ZXIub3BlbnNlYXJjaDo5MjAwIiwidXNlciI6ImFkbWluIiwicHN3ZCI6ImFkbWluIn0=')
  });
  describe('functions ', () => {

    it('getInspectionpolicies1', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpolicies1()
      );
      
      fixture.detectChanges();
      // expect(policyService.getInspectionpolicies).toHaveBeenCalled();

      component.getInspectionpolicies();
      tick(1500);
      // expect(assessmentService.getKubeBenchReport);

    }));

    it('getInspectionpolicies2', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpolicies2()
      );
      
      fixture.detectChanges();
      // expect(policyService.getInspectionpolicies).toHaveBeenCalled();

      component.getInspectionpolicies();
      tick(1500);
      // expect(assessmentService.getKubeBenchReport);

    }));

    it('getInspectionpolicies3', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpolicies3()
      );
      
      fixture.detectChanges();
      // expect(policyService.getInspectionpolicies).toHaveBeenCalled();

      component.getInspectionpolicies();
      tick(1500);
      // expect(assessmentService.getKubeBenchReport);

    }));

    it('getInspectionpoliciesError', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesError()
      );
      
      fixture.detectChanges();

      component.getInspectionpolicies();
      tick(1500);
      
      expect(assessmentService.getKubeBenchReport);
      flush()
    }));

    it('getKubeBenchReport', fakeAsync(() => {
      spyOn(assessmentService, 'getKubeBenchReport').and.returnValue(
        cnsiServiceStub.getKubeBenchReport()
      );
      
      fixture.detectChanges();

      tick(1500);
      expect(assessmentService.getKubeBenchReport);
      flush()
    }));


    
    it('riskCallBack', () => {
      component.riskCallBack({hits: {hits: [
        {
          _source: {
            ReportDetail: [{
              Detail: []
            }]
          }
        }
      ]}}, component, {from: 0, size: 10}, 50)

      component.riskCallBack({hits: {hits: [
        {
          _source: {
            ReportDetail: [{
              Detail: []
            }]
          }
        }
      ]}}, component, {from: 0, size: 10}, 5)

      component.riskCallBack({hits: {hits: [
        {
          _source: {
            ReportDetail: [{
              Detail: []
            }]
          }
        }
      ]}}, component, {from: 0, size: 10})
    })
    it('pageChange', () => {
      component.pageMaxCount = 10
      component.pageChange({page: {current: 1, size: 5}})
      component.pageChange({page: {current: 3, size: 10}})
      
      component.pageMaxCount = 15
      component.pageChange({page: {current: 3, size: 10}})

      component.pageChange({page: {current: 3, size: 12}})
      component.defaultSize = 12
      component.pageChange({page: {current: 3, size: 12}})

    })
    it('echartsRender', () => {
      component.echartsRender([1,2,3], [4,5,6])

      component.echartsRender([1,2,3], [4,4,4])

    })


    it('other test', () => {
      component.riskDetail = {
        dataSourceHandle: () => {}
      } as any
      component.showDetail({})
      component.hideDetai({target: {classList: ['risk-report-detai-bg', 'risk-report-detai-left']}})
      component.createTimeSort()
      component.pagination = {
        page: {
          change: 1
        }  
      }
      component.getRiskReportListCallBack({
        hits: {
          total: {
            value: 6
          },
          hits: [{
            _source: {
              ReportDetail: [{
                Detail: []
              }]
            }
          }]
        }
      }, component, {size: 10})
      component.createTimeSort()
      component.createTimeSortCallBack({hits: {hits: [
        {
          _source: {
            ReportDetail: [{
              Detail: ['test']
            }]
          }
        }
      ]}}, component)
      component.testMousedown({clientX: 777})
      component.testMousemove({clientX: 777})
      component.testMouseup({clientX: 777})
  
    });
  })



  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
