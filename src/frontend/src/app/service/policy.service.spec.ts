/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';

import { PolicyService } from './policy.service';

describe('PolicyService', () => {
  let service: PolicyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolicyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
