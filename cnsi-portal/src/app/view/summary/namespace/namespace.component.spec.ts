/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { NamespaceComponent } from './namespace.component';

describe('NamespaceComponent', () => {
  let component: NamespaceComponent;
  let fixture: ComponentFixture<NamespaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamespaceComponent ],
      imports: [ShardTestModule],
      providers: [PolicyService, ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.shardService.namespaceList = [{name: 'test', workloads: {workloads: {violationList: []}}}] as any
  });

  describe('functions ', () => {

    it('switchNamespace',() => {
      component.shardService.namespaceList = [{
        name: 'test',
        creationTimestamp: 'test',
        labels: {},
        resourceVersion:'test',
        status: 'test',
        workloads: {
          workloads: [
            {
              name: 'Deployment',
              workloadList: [],
              violationList: []
            },
            {
              name: 'ReplicaSet',
              workloadList: [],
              violationList: []
            },
            {
              name: 'StatefulSet',
              workloadList: [],
              violationList: []
            },
            {
              name: 'DaemonSet',
              workloadList: [],
              violationList: []
            },
            {
              name: 'CronJob',
              workloadList: [],
              violationList: []
            },
            {
              name: 'Job',
              workloadList: [],
              violationList: []
            }
          ],
          violationList: [],
          normal: 0,
          abnormal: 1,
          compliant: 2
        }
      }]
      component.switchNamespace('test')
      component.all = true
      component.switchNamespace('test')

    })

  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
