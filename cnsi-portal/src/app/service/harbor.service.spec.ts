/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { TestBed, inject, fakeAsync, flush, tick } from '@angular/core/testing';
import { of } from 'rxjs';
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

  it('Functions', fakeAsync(() => {
    service.updateHarborSetting('test', {
      apiVersion: 'goharbor.goharbor.io/v1alpha1',
      kind: 'Setting',
      metadata: {
        name: 'test',
      },
      spec: {
        cache: {
          address: 'test',
          kind: 'Redis',
          settings: {
            livingTime: 10,
            skipTLSVerify: true
          }
        },
        dataSource: {
          credentialRef: {
            name: 'test',
            namespace: 'test',
          },
          endpoint: 'test',
          name: 'test',
          provider: 'Harbor',
          scanSchedule: 'test',
          skipTLSVerify: true
        },
        knownRegistries: [],
        vacDataSource: {
          endpoint: 'test',
          credentialRef: {
            name: 'test',
            namespace: 'test'
          }
        }
      },
      status: {
        status: 'test'
      }
    
    })

    service.deleteHarborSetting('test')
    service.postHarborSecretsSetting('', {
      data: {
        accessKey: 'test',
        accessSecret: 'test',
        API_TOKEN:'test'
      },
      // immutable: true,
      kind: 'Secret',
      metadata: {
        name: 'test',
        namespace: 'test',
        annotations: {}
      },
      type: 'Opaque'
    })

    service.updateHarborSecretsSetting('', 'test', {
      data: {
        accessKey: 'test',
        accessSecret: 'test',
        API_TOKEN:'test'
      },
      // immutable: true,
      kind: 'Secret',
      metadata: {
        name: 'test',
        namespace: 'test',
        annotations: {}
      },
      type: 'Opaque'
    })
    
    service.deleteHarborSecretsSetting('', 'name')
  }));

  it('should be created', inject(
    [HarborService],
    (service: HarborService) => {
        expect(service).toBeTruthy();
    }
  ));
});
