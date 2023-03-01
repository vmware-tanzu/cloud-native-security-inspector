import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { RiskReportDetailComponent } from './risk-report-detail.component';

describe('RiskReportDetailComponent', () => {
  let component: RiskReportDetailComponent;
  let fixture: ComponentFixture<RiskReportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RiskReportDetailComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
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
