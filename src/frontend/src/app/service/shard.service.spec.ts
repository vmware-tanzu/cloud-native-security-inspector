/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { TestBed, inject } from '@angular/core/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { ShardService } from './shard.service';

describe('ShardService', () => {
  let service: ShardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShardTestModule],
      providers: [ShardService],
    });
    service = TestBed.inject(ShardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
