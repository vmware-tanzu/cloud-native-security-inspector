import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { PolicySettingPageComponent } from './policy-setting-page.component';

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'
import { of, throwError } from 'rxjs';
import { PolicyService } from 'src/app/service/policy.service';
import { HarborService } from 'src/app/service/harbor.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('PolicySettingPageComponent', () => {
  let component: PolicySettingPageComponent;
  let fixture: ComponentFixture<PolicySettingPageComponent>;
  let policyService: PolicyService
  let harborService: HarborService
  const cnsiServiceStub = {
    getInspectionpoliciesAll: () => {
      return of({
        items: [
          {
            metadata: {
              name: 'test'
            },
            spec: {
              workNamespace: 'default',
              strategy: {},
              inspector: {
                image: 'image',
                kubebenchImage: 'kubebenchImage',
                riskImage: 'riskImage',
                exportConfig: {
                  openSearch: {
                    hostport: 'http://123.test'
                  }
                }
              },
              settingsName: 'test-set',
              inspection: {
                actions: [],
                namespaceSelector: {
                  matchLabels: {
                    a: 1
                  }
                },
                workloadSelector: {
                  matchLabels: {
                    a: 1
                  }
                }
              },
              schedule: '******',
              vacAssessmentEnabled: true
            }
          }
        ]
      })
    },
    getInspectionpoliciesInspecKube: () => {
      return of({
        items: [
          {
            metadata: {
              name: 'test'
            },
            spec: {
              workNamespace: 'default',
              strategy: {},
              inspector: {
                image: 'image',
                kubebenchImage: 'kubebenchImage',
                exportConfig: {
                  openSearch: {
                    hostport: 'http://123.test'
                  }
                }
              },
              settingsName: 'test-set',
              inspection: {
                actions: ['123'],
                namespaceSelector: {
                  matchLabels: {
                    a: 1
                  }
                },
                workloadSelector: {
                  matchLabels: {
                    a: 1
                  }
                }
              },
              schedule: '******'
            }
          }
        ]
      })
    },
    getInspectionpoliciesRisk: () => {
      return of({
        items: [
          {
            metadata: {
              name: 'test'
            },
            spec: {
              workNamespace: 'default',
              strategy: {},
              inspector: {
                riskImage: 'riskImage',
                exportConfig: {
                  openSearch: {
                    hostport: 'http://123.test'
                  }
                }
              },
              settingsName: 'test-set',
              inspection: {
                actions: ['123'],
                namespaceSelector: {
                  matchLabels: {
                    a: 1
                  }
                },
                workloadSelector: {
                  matchLabels: {
                    a: 1
                  }
                }
              },
              schedule: '******'
            }
          }
        ]
      })
    },
    getInspectionpoliciesKube: () => {
      return of({
        items: [
          {
            metadata: {
              name: 'test'
            },
            spec: {
              workNamespace: 'default',
              strategy: {},
              inspector: {
                kubebenchImage: 'kubebenchImage',
                exportConfig: {
                  openSearch: {
                    hostport: 'http://123.test'
                  }
                }
              },
              settingsName: 'test-set',
              inspection: {
                actions: ['123'],
                namespaceSelector: {
                  matchLabels: {
                    a: 1
                  }
                },
                workloadSelector: {
                  matchLabels: {
                    a: 1
                  }
                }
              },
              schedule: '******'
            }
          }
        ]
      })
    },
    getInspectionpoliciesInspector: () => {
      return of({
        items: [
          {
            metadata: {
              name: 'test'
            },
            spec: {
              workNamespace: 'default',
              strategy: {},
              inspector: {
                image: 'image',
                exportConfig: {
                  openSearch: {
                    hostport: 'http://123.test'
                  }
                }
              },
              settingsName: 'test-set',
              inspection: {
                actions: ['123'],
                namespaceSelector: {
                  matchLabels: {
                    a: 1
                  }
                },
                workloadSelector: {
                  matchLabels: {
                    a: 1
                  }
                }
              },
              schedule: '******'
            }
          }
        ]
      })
    },
    getInspectionpoliciesRiskInspec: () => {
      return of({
        items: [
          {
            metadata: {
              name: 'test'
            },
            spec: {
              workNamespace: 'default',
              strategy: {},
              inspector: {
                image: true,
                riskImage: 'riskImage',
                exportConfig: {
                  openSearch: {
                    hostport: 'http://123.test'
                  }
                }
              },
              settingsName: 'test-set',
              inspection: {
                actions: ['123'],
                namespaceSelector: {
                  matchLabels: {
                    a: 1
                  }
                },
                workloadSelector: {
                  matchLabels: {
                    a: 1
                  }
                }
              },
              schedule: '******'
            }
          }
        ]
      })
    },
    getInspectionpoliciesRiskKube: () => {
      return of({
        items: [
          {
            metadata: {
              name: 'test'
            },
            spec: {
              workNamespace: 'default',
              strategy: {},
              inspector: {
                kubebenchImage: true,
                riskImage: 'riskImage',
                exportConfig: {
                  openSearch: {
                    hostport: 'http://123.test'
                  }
                }
              },
              settingsName: 'test-set',
              inspection: {
                actions: ['123'],
                namespaceSelector: {
                  matchLabels: {
                    a: 1
                  }
                },
                workloadSelector: {
                  matchLabels: {
                    a: 1
                  }
                }
              },
              schedule: '******'
            }
          }
        ]
      })
    },
    getInspectionpoliciesNull: () => {
      return of({
        items: []
      })
    },
    getInspectionpoliciesError: () => {
      return throwError('test')
    },
    createPolicy: () => {
      return of({})
    },
    createPolicyError: () => {
      return throwError({error: {}})
    },
    deletePolicy: () => {
      return of({})
    },
    deletePolicyError: () => {
      return throwError({error: {}})
    },
    getHarborSetting: () => {
      return of({
        items: []
      })
    }  
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicySettingPageComponent ],
      imports: [ShardTestModule,RouterTestingModule.withRoutes(
        [{path: 'policy', component: PolicySettingPageComponent}]
      )],
      providers: [ShardService, PolicyService, HarborService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();

    fixture = TestBed.createComponent(PolicySettingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    policyService = TestBed.inject(PolicyService);
    harborService = TestBed.inject(HarborService);

  });

  describe('create component', () => {
    it('getInspectionpolicies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesRiskInspec()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(100);
      expect(policyService.getInspectionpolicies);
      flush();
    }))

    it('getInspectionpolicies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesRiskKube()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(100);
      expect(policyService.getInspectionpolicies);
      flush();
    }))

    it('getInspectionpolicies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesAll()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(500);
      expect(policyService.getInspectionpolicies);
      flush();
    }))

    it('getInspectionpolicies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesInspecKube()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(500);
      expect(policyService.getInspectionpolicies);
      flush();
    }))

    it('getInspectionpolicies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesRisk()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(500);
      expect(policyService.getInspectionpolicies);
      flush();
    }))

    it('getInspectionpolicies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesKube()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(500);
      expect(policyService.getInspectionpolicies);
      flush();
    }))

    it('getInspectionpolicies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesInspector()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(500);
      expect(policyService.getInspectionpolicies);
      flush();
    }))


    it('getInspectionpoliciesNull', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesNull()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(1500);
      flush();
    }))

    it('getInspectionpoliciesError', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesError()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(1500);
      flush();
    }))

    it('getSettingList', fakeAsync(() => {
      spyOn(harborService, 'getHarborSetting').and.returnValue(
        cnsiServiceStub.getHarborSetting()
      );
      fixture.detectChanges();
      component.getSettingList()
      tick(1500);
      flush();
    }))

    it('createPolicy', fakeAsync(() => {
      spyOn(policyService, 'createPolicy').and.returnValue(
        cnsiServiceStub.createPolicy()
      );
      fixture.detectChanges();
      component.policyForm.get('inspectionSetting')?.get('image')?.setValue(['inspector', 'kubebench', 'risk'])
      component.namespacelabels = [{key: 'key', value: ''}]
      component.workloadlabels = [{key: 'key', value: ''}]
      component.createPolicy()
      tick(1500);
      flush();
    }))

    it('createPolicy Error', fakeAsync(() => {
      spyOn(policyService, 'createPolicy').and.returnValue(
        cnsiServiceStub.createPolicyError()
      );
      fixture.detectChanges();
      component.createPolicy()
      tick(1500);
      flush();
    }))

    it('deletePolicy', fakeAsync(() => {
      spyOn(policyService, 'deletePolicy').and.returnValue(
        cnsiServiceStub.deletePolicy()
      );
      fixture.detectChanges();
      component.deletePolicy('')
      tick(1500);
      flush();
    }))

    it('deletePolicy Error', fakeAsync(() => {
      spyOn(policyService, 'deletePolicy').and.returnValue(
        cnsiServiceStub.deletePolicyError()
      );
      fixture.detectChanges();
      component.deletePolicy('')
      tick(1500);
      flush();
    }))


    it('Getter', () => {
      component.inspectionSettingValid
      component.inspectionStandardValid
      component.policyForm.get('inspectionSetting')?.get('image')?.setValue(false)
      component.policyForm.get('inspectionSetting')?.get('openSearchEnabled')?.setValue(false)

      component.inspectionSettingValid
      component.baselines.push({
        kind: '',
        baseline:'High',
        version:'v1.1',
        scheme: 'application/vnd.security.vulnerability.report; version=1.1'
      })
      component.namespacelabels.push({
        key: '',
        value: ''
      })
      component.workloadlabels.push({
        key: '',
        value: ''
      })
      component.inspectionStandardValid

    })

    it('policySettingAddItem', () => {
      component.policySettingAddItem('action')
      component.policySettingAddItem('baseline')
      component.policySettingAddItem('namespacelabels')
      component.policySettingAddItem('workloadlabels')
    })
    it('policySettingremoveItem', () => {
      component.policySettingremoveItem('action', 0)
      component.policySettingremoveItem('baseline', 0)
      component.policySettingremoveItem('namespacelabels', 0)
      component.policySettingremoveItem('workloadlabels', 0)
    })
    it('Other', () => {
      component.policyHandler('create')
      component.policyHandler('')
      component.modifyPolicy()
      component.deletePolicy('test')
      component.setSchedule({name: 'test'})
      component.saveSchedule({})
      component.cancelSchedule()
    })




  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
