/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment'
import { HttpClient } from '@angular/common/http';
import { AssessmentReportType, AssessmentType, InspectionPolicyType, PolicyItemType, InspectionType, InspectionItemType } from './policy-model-type'
import { Observable } from 'rxjs';
import { HarborModel, HarborModelResponse, SecretModel, SecretModelResponse } from './harbor-model-type'
@Injectable({
  providedIn: 'root'
})
export class HarborService {
  public environment:any = environment
  constructor(private http: HttpClient) { }

  getHarborSetting() :Observable<HarborModelResponse>{
    return this.http.get<HarborModelResponse>(this.environment.api.goharbor + '/settings')
  }

  postHarborSetting(data:HarborModel) :Observable<AssessmentReportType>{
    return this.http.post<AssessmentReportType>(this.environment.api.goharbor + '/settings', data)
  }

  updateHarborSetting(name: string, data:HarborModel) :Observable<AssessmentReportType>{
    return this.http.put<AssessmentReportType>(this.environment.api.goharbor + '/settings/' + name, data)
  }

  deleteHarborSetting(name: string) :Observable<AssessmentReportType>{
    return this.http.delete<AssessmentReportType>(this.environment.api.goharbor + '/settings/' + name)
  }

  getHarborSecretsSetting(namespace: string = 'default') :Observable<SecretModelResponse>{
    return this.http.get<SecretModelResponse>(this.environment.api.k8s + '/namespaces/'+namespace+'/secrets')
  }

  postHarborSecretsSetting(namespace: string = 'default', data:SecretModel) :Observable<SecretModelResponse>{
    return this.http.post<SecretModelResponse>(this.environment.api.k8sPost + '?path=' + '/api/v1/namespaces/'+namespace+'/secrets', data)
  }

  updateHarborSecretsSetting(namespace: string = 'default', name: string, data:SecretModel) :Observable<SecretModelResponse>{
    return this.http.put<SecretModelResponse>(this.environment.api.k8s + '/namespaces/'+namespace+'/secrets/'+name, data)
  }

  deleteHarborSecretsSetting(namespace: string = 'default', name: string) :Observable<SecretModelResponse>{
    return this.http.get<SecretModelResponse>(this.environment.api.k8s + '/namespaces/'+namespace+'/secrets/'+name)
  }

}
