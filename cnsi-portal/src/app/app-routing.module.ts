/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './view/home/home.component'
import { LoginComponent } from './view/login/login.component';
import { SettingComponent } from './view/setting/setting.component';
import { ReportViewComponent } from './view/assements/report-view/report-view.component'
import { InsightComponent } from './view/insight/insight.component'
import { ClusterPageComponent } from './view/insight/cluster-page/cluster-page.component'
import { NamespacePageComponent } from './view/insight/namespace-page/namespace-page.component'
import { WorkloadPageComponent } from './view/insight/workload-page/workload-page.component'
import { PolicyComponent } from './view/policy/policy.component'
import { HarborSettingPageComponent } from './view/setting/harbor-setting-page/harbor-setting-page.component'
import { PolicySettingPageComponent } from './view/policy/policy-setting-page/policy-setting-page.component'
import { KubeBenchReportComponent } from 'src/app/view/assements/kube-bench-report/kube-bench-report.component'
import { KubeBenchReportListComponent } from 'src/app/view/assements/kube-bench-report-list/kube-bench-report-list.component'
import { KubeBenchReportTestViewComponent } from 'src/app/view/assements/kube-bench-report-test-view/kube-bench-report-test-view.component'
import { KubeBenchReportTestDetailComponent } from 'src/app/view/assements/kube-bench-report-test-detail/kube-bench-report-test-detail.component'
import { RiskReportViewComponent } from 'src/app/view/assements/risk-report-view/risk-report-view.component'

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: 'assessments',
        children: [
          {
            path: 'report',
            component: ReportViewComponent
          },
          {
            path: 'kube-bench',
            component: KubeBenchReportComponent,
            children:[
              {
                path: 'list',
                component: KubeBenchReportListComponent
              },
              {
                path: 'test-view/:id',
                component: KubeBenchReportTestViewComponent
              },
              {
                path: 'test-detail/:id',
                component: KubeBenchReportTestDetailComponent
              },
              {
                path: '',
                pathMatch: 'full',
                redirectTo: 'list'        
              }
            ]
          },
          {
            path: 'risk',
            component: RiskReportViewComponent
          },
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'report'    
          }
        ]
      },
      {
        path: 'insight',
        component: InsightComponent,
        children: [
          {
            path: 'cluster',
            component: ClusterPageComponent
          },
          {
            path: 'namespace',
            component: NamespacePageComponent
          },
          {
            path: 'workload',
            component: WorkloadPageComponent
          },
        ]
      },
      {
        path: 'policy',
        component: PolicyComponent
      },
      {
        path: 'modify-policy/:id',
        component: PolicySettingPageComponent
      },
      {
        path: 'setting',
        component: SettingComponent
      },
      {
        path: 'modify-setting/:id',
        component: HarborSettingPageComponent
      },
      
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'assessments'
      }
    ]
  },
  {
    path: 'login',
    component: LoginComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
