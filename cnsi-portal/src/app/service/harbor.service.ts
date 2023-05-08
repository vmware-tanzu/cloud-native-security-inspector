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
    return this.http.get<HarborModelResponse>(this.environment.api.k8sPost  + '/harbor')
  }

  postHarborSetting(data:HarborModel) :Observable<AssessmentReportType>{
    return this.http.post<AssessmentReportType>(this.environment.api.k8sPost  + '/harbor', {data: JSON.stringify(data)})
  }

  updateHarborSetting(name: string, data:HarborModel) :Observable<AssessmentReportType>{
    return this.http.put<AssessmentReportType>(this.environment.api.k8sPost + '/harbor?name=' + name, {data: JSON.stringify(data)})
  }

  deleteHarborSetting(name: string) :Observable<AssessmentReportType>{
    return this.http.delete<AssessmentReportType>(this.environment.api.k8sPost + '/harbor?name='+ name)
  }

  getHarborSecretsSetting(namespace: string = 'default') :Observable<SecretModelResponse>{
    return this.http.get<SecretModelResponse>(this.environment.api.k8sPost + '/secret?namespace=' + namespace)
  }

  postHarborSecretsSetting(namespace: string = 'default', data:SecretModel) :Observable<SecretModelResponse>{
    return this.http.post<SecretModelResponse>(this.environment.api.k8sPost+ '/secret?namespace=' + namespace, {data: JSON.stringify(data)})
  }

  updateHarborSecretsSetting(namespace: string = 'default', name: string, data:SecretModel) :Observable<SecretModelResponse>{
    return this.http.put<SecretModelResponse>(this.environment.api.k8sPost + '/secret?namespace=' + namespace + '&name='+name, data)
  }

  deleteHarborSecretsSetting(namespace: string = 'default', name: string) :Observable<SecretModelResponse>{
    return this.http.get<SecretModelResponse>(this.environment.api.k8sPost + '/secret?namespace=' + namespace + '&name='+name)
  }

}
