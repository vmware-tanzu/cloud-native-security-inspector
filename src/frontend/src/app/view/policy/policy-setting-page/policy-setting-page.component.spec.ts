import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PolicySettingPageComponent } from './policy-setting-page.component';

import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'
import { of } from 'rxjs';
import { PolicyService } from 'src/app/service/policy.service';

describe('PolicySettingPageComponent', () => {
  let component: PolicySettingPageComponent;
  let fixture: ComponentFixture<PolicySettingPageComponent>;
  let policyService: PolicyService
  const cnsiServiceStub = {
    getInspectionpolicies: () => {
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
                riskImage: '',
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
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicySettingPageComponent ],
      imports: [ShardTestModule],
      providers: [ShardService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

    })
    .compileComponents();

    fixture = TestBed.createComponent(PolicySettingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    policyService = TestBed.inject(PolicyService);

  });

  describe('create component', () => {
    it('getInspectionpolicies', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpolicies()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()

      tick(1500);
      expect(policyService.getInspectionpolicies);
    }))

    it('getInspectionpoliciesNull', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpoliciesNull()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(1500);
    }))

    it('Getter', () => {
      component.inspectionSettingValid
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
      component.createPolicy()
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
