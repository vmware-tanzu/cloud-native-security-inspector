/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module'
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';


import { InsightComponent } from './insight.component';

describe('InsightComponent', () => {
  let component: InsightComponent;
  let fixture: ComponentFixture<InsightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InsightComponent ],
      imports: [ShardTestModule],
      providers: [PolicyService, ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InsightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
