/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment'
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AssessmentReportType, AssessmentType, InspectionPolicyType, PolicyItemType, InspectionType, InspectionItemType } from './policy-model-type'
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  public environment:any = environment
  constructor(private http: HttpClient) { }

  getAssessmentreports(limit:number = 10, continues:string='') :Observable<AssessmentReportType>{
    // return this.http.get<AssessmentReportType>(this.environment.api.goharbor + `/assessmentreports`)
    return this.http.get<AssessmentReportType>(this.environment.api.goharbor + `/assessmentreports?limit=${limit}&continue=${continues}`)
  }

  getAllAssessmentreports() :Observable<AssessmentReportType>{
    return this.http.get<AssessmentReportType>(this.environment.api.goharbor + `/assessmentreports`)
  }


  getNamespaceAssessmentreports(namespace: string ='default', limit:number = 10, continues:string='') :Observable<AssessmentReportType>{
    return this.http.get<AssessmentReportType>(this.environment.api.goharbor + `/namespaces/${namespace}/assessmentreports?limit=${limit}&continue=${continues}`)
  }

  getAssessmentreportStatus (namespace:string, name:string) {
    return this.http.get<AssessmentReportType>(this.environment.api.goharbor + `/namespace/${namespace}/assessmentreports/${name}/status`)
  }

  getInspectionpolicies (name?:string):Observable<InspectionPolicyType|PolicyItemType|any> {    
    if (name) {      
      return this.http.get<PolicyItemType>(this.environment.api.goharbor + '/inspectionpolicies/'+name)
    }
    return this.http.get<InspectionPolicyType>(this.environment.api.goharbor + '/inspectionpolicies')
  }

  createPolicy(data:any) {
    return this.http.post(this.environment.api.goharbor + '/inspectionpolicies', data)
  }

  modifyPolicy(name:string, data:any) {
    return this.http.put(this.environment.api.goharbor + '/inspectionpolicies/'+name, data)
  }

  deletePolicy(name:string) {
    return this.http.delete(this.environment.api.goharbor + '/inspectionpolicies/'+ name)
  }

  getInspectionpolicyStatus(name:string) :Observable<PolicyItemType> {
    return this.http.get<PolicyItemType>(this.environment.api.goharbor + '/inspectionpolicies/'+name +'/status')
  }

  getInspection(name?:string) :Observable<InspectionType| InspectionItemType> {
    if (name) {
      return this.http.get<InspectionItemType>(this.environment.api.goharbor + '/inspections/'+name)
    }
    return this.http.get<InspectionType>(this.environment.api.goharbor + '/inspections')
  }

  getInspectionStatus(name:string): Observable<InspectionItemType> {
    return this.http.get<InspectionItemType>(this.environment.api.goharbor + '/inspections'+name +'/status')
  }

  getNamespacesAssessmentreports(namespace: string, name?:string) :Observable<AssessmentReportType| AssessmentType> {
    if (name) {
      return this.http.get<AssessmentType>(this.environment.api.goharbor + '/namespaces/'+namespace +'/assessmentreports'+ name)
    }
    return this.http.get<AssessmentReportType>(this.environment.api.goharbor + '/namespaces/'+namespace +'/assessmentreports')
  }

  getNamespacesAssessmentreportStatus(namespace: string,name:string) :Observable<AssessmentType> {
    return this.http.get<AssessmentType>(this.environment.api.goharbor + '/namespaces/'+namespace +'/assessmentreports'+ name + '/status')
  }

  elasticSearchTest(data: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept':  'application/json',
        'Authorization':'Basic '+window.btoa(data.username+':'+data.password)
      }),
      cert: data.cert
    }    
    // return this.http.get<AssessmentType>('local', httpOptions);
    return this.http.post<AssessmentType>('/es-test', {
      url: data.url,
      basic: window.btoa(data.username+':'+data.password),
      cert: data.cert
    });
  }
}
