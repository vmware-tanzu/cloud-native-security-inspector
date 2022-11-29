import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeBenchReportTestViewComponent } from './kube-bench-report-test-view.component';

describe('KubeBenchReportTestViewComponent', () => {
  let component: KubeBenchReportTestViewComponent;
  let fixture: ComponentFixture<KubeBenchReportTestViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportTestViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KubeBenchReportTestViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
