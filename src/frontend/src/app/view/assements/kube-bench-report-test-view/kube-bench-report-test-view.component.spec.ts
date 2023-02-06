import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { KubeBenchReportTestViewComponent } from './kube-bench-report-test-view.component';

describe('KubeBenchReportTestViewComponent', () => {
  let component: KubeBenchReportTestViewComponent;
  let fixture: ComponentFixture<KubeBenchReportTestViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportTestViewComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [AssessmentService,],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
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
