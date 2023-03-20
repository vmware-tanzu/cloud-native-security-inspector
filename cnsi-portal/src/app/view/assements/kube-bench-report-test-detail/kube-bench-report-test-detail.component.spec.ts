import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { KubeBenchReportTestDetailComponent } from './kube-bench-report-test-detail.component';

describe('KubeBenchReportTestDetailComponent', () => {
  let component: KubeBenchReportTestDetailComponent;
  let fixture: ComponentFixture<KubeBenchReportTestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportTestDetailComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [AssessmentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KubeBenchReportTestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sessionStorage.setItem('cnsi_report_id', 'G-H0uYYBMJJS-ugUjm21')
    sessionStorage.setItem('G-H0uYYBMJJS-ugUjm21', '{"desc": "","_source":{"tests": []},"results": [], "info": 0, "pass": 0, "warn": 0, "fail": 0}')
  });


  describe('functions ', () => {

    it('getLocalhostData', ()=> {
      component.getLocalhostData()
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
