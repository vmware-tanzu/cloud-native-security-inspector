import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';
import { APP_BASE_HREF } from '@angular/common';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { ShardService } from './service/shard.service';
import { Observable, of } from 'rxjs';

describe('AppComponent', () => {
    let fixture: ComponentFixture<any>;
    let component: AppComponent;
    let compiled: any;
    let shardService: ShardService
    const fakeCookieService = null;
    const vmcServiceStub = {
        getNamespaceList() {
          return of<{items:any[]}>({
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
          });
        },
    }
    let fakeSessionService = {
        getCurrentUser: function () {
            return { has_admin_role: true };
        },
    };
    let fakeAppConfigService = {
        isIntegrationMode: function () {
            return true;
        },
    };
    let fakeTitle = {
        setTitle: function () {},
    };
    const fakeSkinableConfig = {
        getSkinConfig() {
            return {
                headerBgColor: {
                    darkMode: '',
                    lightMode: '',
                },
                loginBgImg: '',
                loginTitle: '',
                product: {
                    name: 'test',
                    logo: '',
                    introduction: '',
                },
            };
        },
        setTitleIcon() {},
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AppComponent],
            imports: [ShardTestModule],
            providers: [
                { provide: APP_BASE_HREF, useValue: '/' },
                { provide: Title, useValue: fakeTitle },
                ShardService
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        });

        fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        compiled = fixture.nativeElement;
        component = fixture.componentInstance;
        shardService = TestBed.get(ShardService);
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create the app', () => {
        expect(compiled).toBeTruthy();
    });

    describe('AppComponent Function', () => {
        it('getNamespaceList', fakeAsync(() => {
          spyOn(shardService, 'getNamespaceList').and.returnValue(
            vmcServiceStub.getNamespaceList()
          );
          component.getNamespaceList();
          fixture.detectChanges();
          expect(shardService.getNamespaceList).toHaveBeenCalled();
          tick(1500);
          expect(shardService.getNamespaceList);
        }));
    });
});

