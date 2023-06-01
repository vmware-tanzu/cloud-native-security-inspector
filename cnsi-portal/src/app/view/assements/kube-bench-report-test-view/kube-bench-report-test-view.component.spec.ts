import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { KubeBenchReportListComponent } from '../kube-bench-report-list/kube-bench-report-list.component';
import { KubeBenchReportTestDetailComponent } from '../kube-bench-report-test-detail/kube-bench-report-test-detail.component';
import { KubeBenchReportComponent } from '../kube-bench-report/kube-bench-report.component';
import { ReportViewComponent } from '../report-view/report-view.component';
import { RiskReportViewComponent } from '../risk-report-view/risk-report-view.component';
import { TrivyViewComponent } from '../trivy-view/trivy-view.component';

import { KubeBenchReportTestViewComponent } from './kube-bench-report-test-view.component';

describe('KubeBenchReportTestViewComponent', () => {
  let component: KubeBenchReportTestViewComponent;
  let fixture: ComponentFixture<KubeBenchReportTestViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportTestViewComponent ],
      imports: [ShardTestModule, RouterTestingModule.withRoutes(
        [{
          path: 'assessments',
          children: [
            {
              path: 'report',
              component: ReportViewComponent
            },
            {
              path: 'kube-bench',
              component: KubeBenchReportComponent,
              children:[
                {
                  path: 'list',
                  component: KubeBenchReportListComponent
                },
                {
                  path: 'test-view/:id',
                  component: KubeBenchReportTestViewComponent
                },
                {
                  path: 'test-detail/:id',
                  component: KubeBenchReportTestDetailComponent
                },
                {
                  path: '',
                  pathMatch: 'full',
                  redirectTo: 'list'        
                }
              ]
            },
            {
              path: 'risk',
              component: RiskReportViewComponent
            },
            {
              path: 'trivy',
              component: TrivyViewComponent
            },
            {
              path: '',
              pathMatch: 'full',
              redirectTo: 'report'    
            }
          ]
        }]
      )],
      providers: [AssessmentService,],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KubeBenchReportTestViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sessionStorage.setItem('cnsi_report_id', 'G-H0uYYBMJJS-ugUjm21')
    sessionStorage.setItem('G-H0uYYBMJJS-ugUjm21', '{"desc": "","_source":{"tests": []},"results": [], "info": 0, "pass": 0, "warn": 0, "fail": 0}')
  });

  describe('functions ', () => {
    it('getLocalhostData', ()=> {
      component.getLocalhostData()
    })


    it('toKubeBenchReportTestResult', ()=> {
      component.toKubeBenchReportTestResult({desc: 'test'})
    })

    it('chartInit', ()=> {
      component.testId = 'G-H0uYYBMJJS-ugUjm21'
      component.chartInit()
    })
    
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
