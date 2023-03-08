/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let shardService: ShardService
  const cnsiServiceStub: any = {
    getNodeList() {
      return of({
        "items": [
          {
            "metadata": {
              "name": "sc2-10-186-131-84.eng.vmware.com",
            },
            status: {
              nodeInfo: {
                kubeletVersion: 'v1.0'
              },
              capacity: {
                cpu: 1,
                memory: 10
              },
              allocatable: {
                cpu: 1,
                memory: 10
              }
            }
          }
        ]
      });
    }
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HomeComponent ],
      imports: [ShardTestModule],
      providers: [PolicyService, ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    shardService = TestBed.inject(ShardService);
    fixture.detectChanges();
  });

  describe('functions ', () => {
    it('should create', () => {
      spyOn(shardService, 'getNodeList').and.returnValue(
        cnsiServiceStub.getNodeList()
      );
      fixture.detectChanges();

      component.getSummaryInfo()
    });  

  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
