import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PolicySettingPageComponent } from './policy-setting-page.component';

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

describe('PolicySettingPageComponent', () => {
  let component: PolicySettingPageComponent;
  let fixture: ComponentFixture<PolicySettingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicySettingPageComponent ],
      imports: [ShardTestModule],
      providers: [ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();

    fixture = TestBed.createComponent(PolicySettingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('getInspectionpolicies()', () => {
    it('get inspectionpolicies', () => {
      const data:any = {
        "apiVersion": "goharbor.goharbor.io/v1alpha1",
        "items": [
          {
            "apiVersion": "goharbor.goharbor.io/v1alpha1",
            "kind": "InspectionPolicy",
            "metadata": {
              "creationTimestamp": "2022-11-17T06:14:02Z",
              "generation": 1,
              "managedFields": [
                {
                  "apiVersion": "goharbor.goharbor.io/v1alpha1",
                  "fieldsType": "FieldsV1",
                  "fieldsV1": {
                    "f:metadata": {
                      "f:deletionGracePeriodSeconds": {}
                    },
                    "f:spec": {
                      ".": {},
                      "f:enabled": {},
                      "f:inspection": {
                        ".": {},
                        "f:actions": {},
                        "f:assessment": {
                          ".": {},
                          "f:elasticSearchEnabled": {},
                          "f:format": {},
                          "f:generate": {},
                          "f:liveTime": {},
                          "f:managedBy": {},
                          "f:openSearchAddr": {},
                          "f:openSearchEnabled": {},
                          "f:openSearchPasswd": {},
                          "f:openSearchUser": {}
                        },
                        "f:baselines": {},
                        "f:namespaceSelector": {
                          ".": {},
                          "f:matchExpressions": {},
                          "f:matchLabels": {}
                        },
                        "f:workloadSelector": {
                          ".": {},
                          "f:matchExpressions": {},
                          "f:matchLabels": {}
                        }
                      },
                      "f:inspector": {
                        ".": {},
                        "f:image": {},
                        "f:imagePullPolicy": {},
                        "f:imagePullSecrets": {}
                      },
                      "f:schedule": {},
                      "f:settingsName": {},
                      "f:strategy": {
                        ".": {},
                        "f:concurrencyRule": {},
                        "f:historyLimit": {},
                        "f:suspend": {}
                      },
                      "f:workNamespace": {}
                    }
                  },
                  "manager": "Mozilla",
                  "operation": "Update",
                  "time": "2022-11-17T06:14:02Z"
                }
              ],
              "name": "test",
              "resourceVersion": "11122",
              "uid": "c29e3d11-a945-4e56-bcc3-1100ea97ceaf"
            },
            "spec": {
              "enabled": true,
              "inspection": {
                "actions": [
                  {
                    "ignore": {
                      "matchExpressions": [],
                      "matchLabels": {}
                    },
                    "kind": "quarantine_vulnerable_workload",
                    "settings": {}
                  }
                ],
                "assessment": {
                  "elasticSearchEnabled": false,
                  "format": "YAML",
                  "generate": true,
                  "liveTime": 3600,
                  "managedBy": true,
                  "openSearchAddr": "https://1231",
                  "openSearchEnabled": true,
                  "openSearchPasswd": "admin",
                  "openSearchUser": "admoij"
                },
                "baselines": [
                  {
                    "baseline": "High",
                    "kind": "vulnerability",
                    "scheme": "application/vnd.security.vulnerability.report; version=1.1",
                    "version": "v1.1"
                  }
                ],
                "namespaceSelector": {
                  "matchExpressions": [],
                  "matchLabels": {}
                },
                "workloadSelector": {
                  "matchExpressions": [],
                  "matchLabels": {}
                }
              },
              "inspector": {
                "image": "projects.registry.vmware.com/cnsi/inspector:0.3",
                "imagePullPolicy": "IfNotPresent",
                "imagePullSecrets": []
              },
              "schedule": "3/* * * * *",
              "settingsName": "sample-setting",
              "strategy": {
                "concurrencyRule": "Forbid",
                "historyLimit": 5,
                "suspend": false
              },
              "workNamespace": "cronjob"
            }
          }
        ],
        "kind": "InspectionPolicyList",
        "metadata": {
          "continue": "",
          "resourceVersion": "18650"
        }
      }
      component.getInspectionpolicies();
      component.createPolicy()
      component.modifyPolicy()
      component.setSchedule({hour: 3})
      component.saveSchedule({})
      component.cancelSchedule()
      component.policyHandler('test')
      component.testElasticSearch()
      component.getSettingList()
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
