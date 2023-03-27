/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core'
import { AppService } from './app.service';

describe('Service', () => {
  let service: AppService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forChild({
          extend: true,
        }),
        HttpClientTestingModule
      ],
      providers: [TranslateStore, TranslateService]
    
    });
    service = TestBed.inject(AppService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
