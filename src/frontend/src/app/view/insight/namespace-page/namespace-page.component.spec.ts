/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamespacePageComponent } from './namespace-page.component';

describe('NamespacePageComponent', () => {
  let component: NamespacePageComponent;
  let fixture: ComponentFixture<NamespacePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamespacePageComponent ]
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
