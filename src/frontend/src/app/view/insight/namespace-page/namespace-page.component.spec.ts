/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module'
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

import { NamespacePageComponent } from './namespace-page.component';

describe('NamespacePageComponent', () => {
  let component: NamespacePageComponent;
  let fixture: ComponentFixture<NamespacePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamespacePageComponent ],
      imports: [ShardTestModule],
      providers: [PolicyService, ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespacePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
