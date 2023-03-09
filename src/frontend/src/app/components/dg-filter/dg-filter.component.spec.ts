import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssessmentService } from 'src/app/service/assessment.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { DgFilterComponent } from './dg-filter.component';

describe('DgFilterComponent', () => {
  let component: DgFilterComponent;
  let fixture: ComponentFixture<DgFilterComponent>;
  let policyService:PolicyService
  const cnsiServiceStub: any = {
    
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DgFilterComponent ],
      imports: [ShardTestModule],
      providers: [AssessmentService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DgFilterComponent);
    component = fixture.componentInstance;
    policyService = TestBed.inject(PolicyService);
    fixture.detectChanges();
  });

  describe('DgFilterComponent Function', () => {
    it('search', () => {
      component.search()

      component.label = 'test'
      component.search()
      component.isActive()
      component.accepts({})
    });
  
  })


  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
