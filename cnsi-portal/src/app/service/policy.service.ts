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
    return this.http.get<AssessmentReportType>(this.environment.api.goharbor + `/assessmentreports?limit=${limit}&continue=${continues}`)
  }

  getAllAssessmentreports() :Observable<AssessmentReportType>{
    return this.http.get<AssessmentReportType>(this.environment.api.goharbor + `/assessmentreports`)
  }

  getInspectionpolicies (name?:string):Observable<InspectionPolicyType|PolicyItemType|any> {    
    if (name) {      
      return this.http.get<PolicyItemType>(this.environment.api.k8sPost + '/policy?path=' + '/apis/goharbor.goharbor.io/v1alpha1/inspectionpolicies/'+name)
    }
    return this.http.get<InspectionPolicyType>(this.environment.api.k8sPost + '/policy?path=' + '/apis/goharbor.goharbor.io/v1alpha1/inspectionpolicies')
  }

  createPolicy(data:any) {
    return this.http.post(this.environment.api.k8sPost + '/policy?path=' + '/apis/goharbor.goharbor.io/v1alpha1/inspectionpolicies', {data: JSON.stringify(data)})
  }

  modifyPolicy(name:string, data:any) {
    return this.http.put(this.environment.api.k8sPost + '/policy?path=' + '/apis/goharbor.goharbor.io/v1alpha1/inspectionpolicies/'+name, data)
  }

  deletePolicy(name:string) {
    return this.http.delete(this.environment.api.k8sPost + '/policy?path=' + '/apis/goharbor.goharbor.io/v1alpha1/inspectionpolicies/'+ name)
  }

  elasticSearchTest(data: any) {   
    // return this.http.get<AssessmentType>('local', httpOptions);
    return this.http.post<AssessmentType>('/es-test', {
      url: data.url,
      basic: window.btoa(data.username+':'+data.password),
      cert: data.cert
    });
  }
}
