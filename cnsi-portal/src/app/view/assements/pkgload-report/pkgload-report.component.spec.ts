import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PkgloadReportComponent } from './pkgload-report.component';

describe('PkgloadReportComponent', () => {
  let component: PkgloadReportComponent;
  let fixture: ComponentFixture<PkgloadReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PkgloadReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PkgloadReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
