import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AssessmentService } from 'src/app/service/assessment.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { KubeBenchReportListComponent } from './kube-bench-report-list.component';

describe('KubeBenchReportListComponent', () => {
  let component: KubeBenchReportListComponent;
  let fixture: ComponentFixture<KubeBenchReportListComponent>;
  let policyService: PolicyService
  let shardService: ShardService
  let assessmentService: AssessmentService
  const cnsiServiceStub: any = {
    getNodeList() {
      return of({
        "items": [
          {
            "metadata": {
              "name": "sc2-10-186-131-84.eng.vmware.com",
            },
          },
          {
            "metadata": {
              "name": "sc2-10-186-134-223.eng.vmware.com",
            },
          },
          {
            "metadata": {
              "name": "sc2-10-186-142-227.eng.vmware.com",
            },
          }
        ]
      });
    },
    getInspectionpolicies(): Observable<any> {
      return of(
        {"items":[{"spec":{"inspector":{"imagePullPolicy":"IfNotPresent","kubebenchImage":"projects.registry.vmware.com/cnsi/kubebench:0.3"}}}],}
      )
    },
    getPodList() {
      return of({
        "items": [
          {
            "metadata": {
              "name": "inspectionpolicy-sample-kubebench-daemonset-7qjdg",
            },
            "spec": {
              nodeName: "sc2-10-186-134-223.eng.vmware.com"
            }
          },
          {
            "metadata": {
              "name": "inspectionpolicy-sample-kubebench-daemonset-s2dql",
            },
            "spec": {
              nodeName: "sc2-10-186-142-227.eng.vmware.com"
            }  
          },
          {
            "metadata": {
              "name": "inspectionpolicy-sample-kubebench-daemonset-zb882",
            },
            "spec": {
              nodeName: "sc2-10-186-131-84.eng.vmware.com"
            }
          }
        ]
      })
    },
    getKubeBenchReport() {
      return of({
        "hits": {
            "total": {
                "value": 2
            },
            "hits": [
                {
                    "_id": "kubebench-Report_2023-02-15T15:19:14Z_4q7dm",
                    "_source": {
                        "id": "4",
                        "text": "Worker Node Security Configuration",
                        "node_type": "node",
                        "tests": [
                            {
                                "section": "4.2",
                                "type": "",
                                "pass": 9,
                                "fail": 1,
                                "warn": 3,
                                "info": 0,
                                "results": [
                                    {
                                        "test_number": "4.2.1",
                                        "test_desc": "Ensure that the anonymous-auth argument is set to false (Automated)",
                                        "status": "PASS"
                                    }
                                ]
                            }
                        ],
                        "total_pass": 19,
                        "total_fail": 1,
                        "total_warn": 3,
                        "total_info": 0,
                        "createTime": "2023-02-15T15:19:14Z",
                        "node_name": "inspectionpolicy-sample-kubebench-daemonset-s2dql"
                    }
                }
            ]
        }
    })
    }
    
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KubeBenchReportListComponent ],
      imports: [ShardTestModule],
      providers: [AssessmentService, PolicyService, ShardService, ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KubeBenchReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeBenchReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    policyService = TestBed.inject(PolicyService);
    shardService = TestBed.inject(ShardService);
    assessmentService = TestBed.inject(AssessmentService);
    localStorage.setItem('cnsi-open-search', 'dTc0OVZRRjdoRXFEVFoyeTE2MVI5SjhGeyJ1cmwiOiJodHRwczovL29wZW5zZWFyY2gtY2x1c3Rlci1tYXN0ZXIub3BlbnNlYXJjaDo5MjAwIiwidXNlciI6ImFkbWluIiwicHN3ZCI6ImFkbWluIn0=')
    localStorage.setItem('cnsi-elastic-search', 'dTc0OVZRRjdoRXFEVFoyeTE2MVI5SjhGeyJ1cmwiOiJodHRwczovL29wZW5zZWFyY2gtY2x1c3Rlci1tYXN0ZXIub3BlbnNlYXJjaDo5MjAwIiwidXNlciI6ImFkbWluIiwicHN3ZCI6ImFkbWluIn0=')
  });

  describe('functions ', () => {

    it('get all data', fakeAsync(() => {
      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpolicies()
      );

      spyOn(shardService, 'getNodeList').and.returnValue(
        cnsiServiceStub.getNodeList()
      );

      spyOn(shardService, 'getPodList').and.returnValue(
        cnsiServiceStub.getPodList()
      );

      spyOn(assessmentService, 'getKubeBenchReport').and.returnValue(
        cnsiServiceStub.getKubeBenchReport()
      );
      
      fixture.detectChanges();
      // expect(policyService.getInspectionpolicies).toHaveBeenCalled();

      component.getNodeList();
      component.getPodList();
      component.getInspectionpolicies()
      tick(1500);
      expect(policyService.getInspectionpolicies);
      expect(shardService.getNodeList)
      expect(shardService.getPodList)

    }));

    it('get null data', fakeAsync(() => {
      cnsiServiceStub.getInspectionpolicies = () => of({items:[]})

      spyOn(policyService, 'getInspectionpolicies').and.returnValue(
        cnsiServiceStub.getInspectionpolicies()
      );
      fixture.detectChanges();
      component.getInspectionpolicies()
      tick(1500);
      expect(policyService.getInspectionpolicies);

    }));

    it('init', () => {
      component.init()
    });

    it('init', () => {
      localStorage.removeItem('cnsi-open-search')
      component.init()
    });


    it('other', () => {
      component.opensearchInfo = {
        "url": "https://opensearch-cluster-master.opensearch:9200",
        "user": "admin",
        "pswd": "admin"
      };
      component.pagination = {
        page: {
          size: 10
        }
      }
      component.getKubeBenchReportListQuery = {
        "size": 10,
        "from": 0,
        "sort": [
            {
                "createTime": {
                    "order": "desc"
                }
            }
        ],
        "query": {
            "match": {
                "text": "Worker Node Security Configuration"
            }
        }
      }
      component.getKubeBenchReportListFilter = {
        "value": "Worker Node Security Configuration",
        "key": "text",
        "reset": true
      }
      component.switchNode('sc2-10-186-131-84.eng.vmware.com"');
      component.pageChange({
        "page": {
            "from": 0,
            "to": 1,
            "size": 20,
            "current": 1
          }
      });

      component.toKubeBenchReportTests({
        "_id": "kubebench-Report_2023-02-15T15:19:14Z_4q7dm",
      })

      component.createTimeSort()

      component.createTimeSortCallBack({
          "hits": {
              "hits": []
          }
      }, component)

      component.getKubeBenchReportList({
        "value": "Kubernetes Policies",
        "key": "text",
        "reset": true
      })


      component.createTimeSort()
      component.getKubeBenchReportList({
        "value": "Worker Node Security Configuration",
        "key": "text",
        "reset": true
      })
      component.initKubeBenchReportListCallBack({
        "hits": {
            "total": {
                "value": 2,
            },
            "hits": []
        }
      }, component)

      component.getKubeBenchReportListCallBack({
        "hits": {
            "total": {
                "value": 2,
            },
            "hits": []
        }
      }, component)
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
