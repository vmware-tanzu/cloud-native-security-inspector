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

    it('sharedChangeHandle', () => {
      component.sharedChangeHandle({
        target: {
          checked: true
        }
      }, 'day', 1)
      component.sharedChangeHandle({
        target: {
          checked: true
        }
      }, 'week', 1)

      component.sharedChangeHandle({
        target: {
          checked: true
        }
      }, 'month', 1)

      component.sharedChangeHandle({
        target: {
          checked: false
        }
      }, 'day', 1)
      component.sharedChangeHandle({
        target: {
          checked: false
        }
      }, 'week', 1)

      component.sharedChangeHandle({
        target: {
          checked: false
        }
      }, 'month', 1)

    })

    it('save', () => {
      component.cornType = 'customize'
      component.save()

      component.getMultipleType = 'week'
      component.save()

      component.getMultipleType = 'other'
      component.save()

      component.cornType = 'daily'
      component.save()

      component.cornType = 'hourly'
      component.save()

      component.cornType = 'other'
      component.save()   
      
      component.timeType = false
      component.save()   

      component.timeTypeIsFalseFuc()


    })

    it('other ', () => {
      component.cancel()

      component.spacedTypeChange()
    })

});

});
