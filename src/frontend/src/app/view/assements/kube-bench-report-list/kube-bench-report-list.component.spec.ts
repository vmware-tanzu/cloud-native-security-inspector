import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeBenchReportListComponent } from './kube-bench-report-list.component';

describe('KubeBenchReportListComponent', () => {
  let component: KubeBenchReportListComponent;
  let fixture: ComponentFixture<KubeBenchReportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KubeBenchReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
