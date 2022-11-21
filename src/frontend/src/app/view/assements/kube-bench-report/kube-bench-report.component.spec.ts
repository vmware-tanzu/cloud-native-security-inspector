import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeBenchReportComponent } from './kube-bench-report.component';

describe('KubeBenchReportComponent', () => {
  let component: KubeBenchReportComponent;
  let fixture: ComponentFixture<KubeBenchReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KubeBenchReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
