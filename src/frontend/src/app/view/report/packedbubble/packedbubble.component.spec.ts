/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackedbubbleComponent } from './packedbubble.component';

describe('PackedbubbleComponent', () => {
  let component: PackedbubbleComponent;
  let fixture: ComponentFixture<PackedbubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PackedbubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PackedbubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
