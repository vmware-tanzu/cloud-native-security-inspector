import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskReportViewComponent } from './risk-report-view.component';

describe('RiskReportViewComponent', () => {
  let component: RiskReportViewComponent;
  let fixture: ComponentFixture<RiskReportViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportViewComponent ]
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
