import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PkgloadReportDetailComponent } from './pkgload-report-detail.component';

describe('PkgloadReportDetailComponent', () => {
  let component: PkgloadReportDetailComponent;
  let fixture: ComponentFixture<PkgloadReportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PkgloadReportDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PkgloadReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
