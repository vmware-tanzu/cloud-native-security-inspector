/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CornComponent } from './corn.component';

describe('CornComponent', () => {
  let component: CornComponent;
  let fixture: ComponentFixture<CornComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CornComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CornComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
