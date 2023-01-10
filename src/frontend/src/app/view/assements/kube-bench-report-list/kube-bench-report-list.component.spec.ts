import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { KubeBenchReportListComponent } from './kube-bench-report-list.component';

describe('KubeBenchReportListComponent', () => {
  let component: KubeBenchReportListComponent;
  let fixture: ComponentFixture<KubeBenchReportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportListComponent ],
      imports: [ShardTestModule],
      providers: [AssessmentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
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
