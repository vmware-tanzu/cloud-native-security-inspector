/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, inject } from '@angular/core/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { environment } from 'src/environments/environment';
import { ShardService } from './shard.service';
describe('ShardService', () => {
  let service: ShardService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        ShardService
      ]
    })
    service = TestBed.inject(ShardService);
    // httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);

  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNamespaceList()', () => {
    it('should return an Observable<NameSpaceSourceModel> with data', () => {
      const mockResponse = {
        items: [
          {
            "metadata": {
              "name": "cnsi-system",
              "uid": "8fc590fc-3b1a-4099-80fc-95559c58f5c7",
              "resourceVersion": "3218730",
              "creationTimestamp": "2023-01-04T07:30:54Z",
              "labels": {
                "control-plane": "cnsi-controller",
                "kubernetes.io/metadata.name": "cnsi-system"
              },
              "annotations": {
                "kubectl.kubernetes.io/last-applied-configuration": "{\"apiVersion\":\"v1\",\"kind\":\"Namespace\",\"metadata\":{\"annotations\":{},\"labels\":{\"control-plane\":\"cnsi-controller\"},\"name\":\"cnsi-system\"}}\n"
              },
              "managedFields": [
                {
                  "manager": "kubectl-client-side-apply",
                  "operation": "Update",
                  "apiVersion": "v1",
                  "time": "2023-01-04T07:30:57Z",
                  "fieldsType": "FieldsV1",
                  "fieldsV1": {
                    "f:metadata": {
                      "f:annotations": {
                        ".": {},
                        "f:kubectl.kubernetes.io/last-applied-configuration": {}
                      },
                      "f:labels": {
                        ".": {},
                        "f:control-plane": {},
                        "f:kubernetes.io/metadata.name": {}
                      }
                    }
                  }
                }
              ]
            },
            "spec": {
              "finalizers": [
                "kubernetes"
              ]
            },
            "status": {
              "phase": "Active"
            }
          }
        ]
      }

      const mockUrl = environment.api.k8s + '/namespaces';
      service.getNamespaceList().subscribe(data => {
        expect(data.items.length).toBe(1);
      });

      const req = httpTestingController.expectOne(mockUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(mockResponse);
    });
  });
});
