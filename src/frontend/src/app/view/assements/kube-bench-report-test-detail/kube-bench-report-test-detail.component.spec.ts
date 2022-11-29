import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeBenchReportTestDetailComponent } from './kube-bench-report-test-detail.component';

describe('KubeBenchReportTestDetailComponent', () => {
  let component: KubeBenchReportTestDetailComponent;
  let fixture: ComponentFixture<KubeBenchReportTestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportTestDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KubeBenchReportTestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
