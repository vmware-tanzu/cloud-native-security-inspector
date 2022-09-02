/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { ReportViewDetailComponent } from './report-view-detail.component';

describe('ReportViewDetailComponent', () => {
  let component: ReportViewDetailComponent;
  let fixture: ComponentFixture<ReportViewDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportViewDetailComponent ],
      imports: [ShardTestModule],
      providers: [ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportViewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
