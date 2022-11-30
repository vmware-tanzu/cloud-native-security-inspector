import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportDetailComponent } from './risk-report-detail.component';

describe('RiskReportDetailComponent', () => {
  let component: RiskReportDetailComponent;
  let fixture: ComponentFixture<RiskReportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiskReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
