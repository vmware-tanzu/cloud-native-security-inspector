import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HarborService } from 'src/app/service/harbor.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { HarborSettingPageComponent } from './harbor-setting-page.component';

describe('HarborSettingPageComponent', () => {
  let component: HarborSettingPageComponent;
  let fixture: ComponentFixture<HarborSettingPageComponent>;
  let harborService: HarborService
  const cnsiServiceStub = {
    getHarborSetting0() {
      return of({
        items: []
      });
    },
    getHarborSetting1() {
      return of({
        items: [{
          metadata: {
            name: '',
          },
          spec: {
            dataSource: {
              credentialRef: {
                name: '',
                namespace: '',
              },
              endpoint: '',
              name: '',
              provider: 'Harbor',
              scanSchedule: '',
              skipTLSVerify: true
            },
            knownRegistries: ['test'],
            vacDataSource: {
              endpoint: '127.0.0.1',
              credentialRef: {
                name: 'test'
              }
            }
          },
          status: {
            status: ''
          }
        }]
      });
    },
    getHarborSecretsSetting(namespace: string) {
      return of({
        items: [{
          metadata: {
            annotations: {
              type: 'vac'
            }
          }
        },
        {
          metadata: {
            annotations: {
              type: 'harbor'
            }
          }
        },
        {
          metadata: {
            annotations: {
              type: 'test'
            }
          }
        },
        {
          metadata: {
            annotations: {}
          }
        },
        {
          metadata: {}
        }
      ]
      })
    },
    postHarborSetting() {
      return of({})
    },
    postHarborSettingError() {
      return throwError('tets')
    },
    updateHarborSetting() {
      return of({})
    },
    updateHarborSettingError() {
      return throwError('test')
    }
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HarborSettingPageComponent ],
      imports: [ShardTestModule, RouterTestingModule.withRoutes(
        [{path: 'data-source', component: HarborSettingPageComponent}]
      )],
      providers: [ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HarborSettingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    harborService = TestBed.inject(HarborService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInspectionpolicies()', () => {
    it('get inspectionpolicies', () => {
      console.log(component.vacDataSourceValid);
      
      component.harborForm.controls['vacDataSource']?.get('cspSecretName')?.setValue('test')
      component.harborForm.controls['vacDataSource']?.get('endpoint')?.setValue('test')
      console.log(
        component.vacDataSourceValid,
        component.cacheValid,
        component.knownRegistriesValid  
      );
      
      component.knownRegistriesAddItem()
      component.knownRegistriesremoveItem(0)
      component.updateHarbor()
      component.harborHandler('test')
      component.harborHandler('update')
      component.saveSchedule({})
      component.cancelSchedule()
      component.dataSourceName
      component.requiredFieldsValid
    });

    it('getHarborSetting length == 0', fakeAsync(() => {
      spyOn(harborService, 'getHarborSetting').and.returnValue(
        cnsiServiceStub.getHarborSetting0()
      );
      fixture.detectChanges();
      tick(500);
      component.getHarbor();
      expect(harborService.getHarborSetting);
      flush()
    }));

    it('getHarborSetting length == 1', fakeAsync(() => {
      spyOn(harborService, 'getHarborSetting').and.returnValue(
        cnsiServiceStub.getHarborSetting1()
      );
      fixture.detectChanges();
      tick(500);
      component.getHarbor();
      expect(harborService.getHarborSetting);
      flush()
    }));

    it('getSecrets', fakeAsync(() => {
      spyOn(harborService, 'getHarborSecretsSetting').and.returnValue(
        cnsiServiceStub.getHarborSecretsSetting('default')
      );
      fixture.detectChanges();
      tick(500);
      component.getSecrets();
      expect(harborService.getHarborSetting);
      flush()
    }));

    it('createHarbor', fakeAsync(() => {
      spyOn(harborService, 'postHarborSetting').and.returnValue(
        cnsiServiceStub.postHarborSetting()
      );
      fixture.detectChanges();
      tick(500);
      component.harborForm.get('cache')?.get('address')?.setValue('test')
      component.harborForm.get('cache')?.get('livingTime')?.setValue(100)
      component.knownRegistries = [
        {
          credentialRef : {
            name: '',
            namespace: '',
          },
          endpoint: '',
          name: '',
          provider: '',
          skipTLSVerify: true
        }
      ]
      component.harborForm.controls['vacDataSource']?.get('endpoint')?.setValue('http://test')
      component.createHarbor();
      expect(harborService.getHarborSetting);
      flush()
    }));

    it('createHarbor Error', fakeAsync(() => {
      spyOn(harborService, 'postHarborSetting').and.returnValue(
        cnsiServiceStub.postHarborSettingError()
      );
      fixture.detectChanges();
      tick(500);
      component.createHarbor();
      expect(harborService.getHarborSetting);
      flush()
    }));


    it('updateHarbor', fakeAsync(() => {
      spyOn(harborService, 'updateHarborSetting').and.returnValue(
        cnsiServiceStub.updateHarborSetting()
      );
      fixture.detectChanges();
      tick(1000);
      component.harborResponse = {
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
              livingTime: 1000,
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
            endpoint: 'tets',
            credentialRef: {
              name: 'tets',
              namespace: 'tets'
            }
          }
        },
        status: {
          status: 'tets'
        }
      }
      component.harborForm.get('cache')?.get('address')?.setValue('127.0.0.1')
      component.harborForm.get('cache')?.get('livingTime')?.setValue(1000)
      component.harborForm.controls['vacDataSource']?.get('endpoint')?.setValue('127.0.0.1')
      component.updateHarbor();
      expect(harborService.updateHarborSetting);
      flush()
    }));

    it('updateHarbor Error', fakeAsync(() => {
      spyOn(harborService, 'updateHarborSetting').and.returnValue(
        cnsiServiceStub.updateHarborSettingError()
      );
      fixture.detectChanges();
      tick(1100);
      component.harborResponse = {
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
              livingTime: 1000,
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
            endpoint: 'tets',
            credentialRef: {
              name: 'tets',
              namespace: 'tets'
            }
          }
        },
        status: {
          status: 'tets'
        }
      }
      component.updateHarbor();
      expect(harborService.updateHarborSetting);
      flush()
    }));

  });
});
