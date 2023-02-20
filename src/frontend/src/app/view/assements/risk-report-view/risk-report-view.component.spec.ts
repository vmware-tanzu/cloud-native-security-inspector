import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { RiskReportViewComponent } from './risk-report-view.component';

describe('RiskReportViewComponent', () => {
  let component: RiskReportViewComponent;
  let fixture: ComponentFixture<RiskReportViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportViewComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [AssessmentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskReportViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
