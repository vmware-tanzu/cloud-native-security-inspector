/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardService } from 'src/app/service/shard.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

import { ReportViewComponent } from './report-view.component';

describe('ReportViewComponent', () => {
  let component: ReportViewComponent;
  let fixture: ComponentFixture<ReportViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportViewComponent ],
      imports: [ShardTestModule],
      providers: [ShardService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
