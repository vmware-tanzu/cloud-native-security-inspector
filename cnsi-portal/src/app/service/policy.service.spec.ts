/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { TestBed, inject, fakeAsync } from '@angular/core/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { PolicyService } from './policy.service';

describe('PolicyService', () => {
  let service: PolicyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShardTestModule],
      providers: [PolicyService],
    });
    service = TestBed.inject(PolicyService);
  });


  it('Functions', fakeAsync(() => {
    service.getAssessmentreports()

    service.getAllAssessmentreports()
    
    service.getInspectionpolicies('test')

    service.modifyPolicy('test', {});

    service.elasticSearchTest({})
  }));
  
  it('should be created', inject(
    [PolicyService],
    (service: PolicyService) => {
        expect(service).toBeTruthy();
    }
  ));
});
