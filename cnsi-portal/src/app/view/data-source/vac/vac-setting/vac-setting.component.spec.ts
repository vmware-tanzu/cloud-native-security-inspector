import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { VacSettingComponent } from './vac-setting.component';

describe('VacSettingComponent', () => {
  let component: VacSettingComponent;
  let fixture: ComponentFixture<VacSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VacSettingComponent ],
      imports: [ShardTestModule, RouterTestingModule],
      providers: [AssessmentService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();

    fixture = TestBed.createComponent(VacSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
