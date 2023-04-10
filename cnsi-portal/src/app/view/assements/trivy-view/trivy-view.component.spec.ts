import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrivyViewComponent } from './trivy-view.component';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { PolicyService } from 'src/app/service/policy.service';

describe('TrivyViewComponent', () => {
  let component: TrivyViewComponent;
  let fixture: ComponentFixture<TrivyViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrivyViewComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [AssessmentService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrivyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
