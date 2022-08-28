/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';

import { HarborService } from './harbor.service';

describe('HarborService', () => {
  let service: HarborService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HarborService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
