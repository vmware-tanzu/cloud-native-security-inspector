/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { TestBed, inject } from '@angular/core/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { HarborService } from './harbor.service';

describe('HarborService', () => {
  let service: HarborService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShardTestModule],
      providers: [HarborService],
    });
    service = TestBed.inject(HarborService);
  });

  it('should be created', inject(
    [HarborService],
    (service: HarborService) => {
        expect(service).toBeTruthy();
    }
  ));
});
