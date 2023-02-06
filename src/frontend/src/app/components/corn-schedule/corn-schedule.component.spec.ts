/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { CornScheduleComponent } from './corn-schedule.component';

describe('CornScheduleComponent', () => {
  let component: CornScheduleComponent;
  let fixture: ComponentFixture<CornScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CornScheduleComponent ],
      imports: [ShardTestModule],
      providers: [PolicyService, ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CornScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('CornScheduleComponent Function', () => {
    it('getMultipleType', () => {
      component.getMultipleType = 'day'
      setTimeout(() => {
        component.getMultipleType = 'day2'
      }, 100);
    });
    
    it('setTimePicker', () => {
      component.setTimePicker({hour: {value: 10}, minute: {value: 10}})
    })

    it('setTimePicker', () => {
      component.setTimePicker({hour: {value: 10}, minute: {value: 10}})
    })


});

});
