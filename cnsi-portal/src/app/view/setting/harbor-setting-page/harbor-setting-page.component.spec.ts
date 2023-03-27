import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { HarborSettingPageComponent } from './harbor-setting-page.component';

describe('HarborSettingPageComponent', () => {
  let component: HarborSettingPageComponent;
  let fixture: ComponentFixture<HarborSettingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HarborSettingPageComponent ],
      imports: [ShardTestModule],
      providers: [ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HarborSettingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInspectionpolicies()', () => {
    it('get inspectionpolicies', () => {
      component.getSecrets()
      component.getHarbor()
      component.createHarbor()
      component.updateHarbor()
      component.harborHandler('test')
      component.saveSchedule({})
      component.cancelSchedule()
      component.dataSourceName
      component.requiredFieldsValid
    });
  });
});
