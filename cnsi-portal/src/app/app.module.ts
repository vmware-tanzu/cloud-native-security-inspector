/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClarityModule } from '@clr/angular';
import { HomeComponent } from './view/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { NavComponent } from './components/nav/nav.component';
import { ClusterComponent } from './view/summary/cluster/cluster.component'
import { PackedbubbleComponent } from './view/report/packedbubble/packedbubble.component';
import { HarborSettingComponent } from './view/data-source/harbor-setting/harbor-setting.component';
import { LoginComponent } from './view/login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HistogramComponent } from './view/report/histogram/histogram.component';
import { LineComponent } from './view/report/line/line.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NamespaceComponent } from './view/summary/namespace/namespace.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReportViewDetailComponent } from './view/assements/report-view-detail/report-view-detail.component';
import { ReportViewComponent } from './view/assements/report-view/report-view.component';
import { InsightComponent } from './view/insight/insight.component';
import { ClusterPageComponent } from './view/insight/cluster-page/cluster-page.component';
import { NamespacePageComponent } from './view/insight/namespace-page/namespace-page.component';
import { WorkloadPageComponent } from './view/insight/workload-page/workload-page.component';
import { WorkloadDetailComponent } from './view/insight/workload-detail/workload-detail.component';
import { PolicyComponent } from './view/policy/policy.component';
import { CornScheduleComponent } from './components/corn-schedule/corn-schedule.component';
import { TimePickerComponent } from './components/time-picker/time-picker.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { AppService } from './app.service';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ClusterLineComponent } from './view/report/cluster-line/cluster-line.component';
import { NamesapcePolarComponent } from './view/report/namesapce-polar/namesapce-polar.component';
import { NamesapceHistogramComponent } from './view/report/namesapce-histogram/namesapce-histogram.component'
import { DgFilterComponent } from './components/dg-filter/dg-filter.component';
import { HarborSettingPageComponent } from './view/data-source/harbor-setting/harbor-setting-page/harbor-setting-page.component';
import { PolicySettingPageComponent } from './view/policy/policy-setting-page/policy-setting-page.component';
import { KubeBenchReportListComponent } from './view/assements/kube-bench-report-list/kube-bench-report-list.component';
import { KubeBenchReportTestViewComponent } from './view/assements/kube-bench-report-test-view/kube-bench-report-test-view.component';
import { KubeBenchReportTestDetailComponent } from './view/assements/kube-bench-report-test-detail/kube-bench-report-test-detail.component';
import { KubeBenchReportComponent } from './view/assements/kube-bench-report/kube-bench-report.component';
import { RiskReportViewComponent } from './view/assements/risk-report-view/risk-report-view.component';
import { RiskReportDetailComponent } from './view/assements/risk-report-detail/risk-report-detail.component'
import { VacComponent } from './view/data-source/vac/vac.component';
import { VacSettingComponent } from './view/data-source/vac/vac-setting/vac-setting.component';

import '@cds/core/icon/register.js';
import { 
  ClarityIcons,
  worldIcon,
  searchIcon,
  bellIcon,
  helpIcon,
  userIcon,
  lineChartIcon,
  organizationIcon,
  cogIcon,
  fileSettingsIcon,
  timesCircleIcon,
  clockIcon,
  filterGridIcon,
  windowCloseIcon,
  arrowIcon,
  popOutIcon,
  angleIcon,
  checkCircleIcon,
  exclamationCircleIcon,
  exclamationTriangleIcon,
  infoCircleIcon,
  barsIcon,
  detailsIcon,
  successStandardIcon,
  plusIcon,
  noteIcon,
  trashIcon,
  pencilIcon,
  networkGlobeIcon,
  timesIcon,
  plusCircleIcon,
  minusCircleIcon,
  cpuIcon,
  memoryIcon,
  viewListIcon,
  importIcon
} from '@cds/core/icon';
import { DoshboardComponent } from './view/doshboard/doshboard.component';
import { TrivyViewComponent } from './view/assements/trivy-view/trivy-view.component';
import { TrivyViewDetailComponent } from './view/assements/trivy-view-detail/trivy-view-detail.component';
import { SecretComponent } from './view/setting/secret/secret.component';
import { CacheComponent } from './view/setting/cache/cache.component';

ClarityIcons.addIcons(
  userIcon,
  worldIcon,
  searchIcon,
  bellIcon,
  helpIcon,
  lineChartIcon,
  organizationIcon,
  cogIcon,
  fileSettingsIcon,
  timesCircleIcon,
  clockIcon,
  filterGridIcon,
  windowCloseIcon,
  arrowIcon,
  popOutIcon,
  angleIcon,
  checkCircleIcon,
  exclamationCircleIcon,
  exclamationTriangleIcon,
  infoCircleIcon,
  barsIcon,
  detailsIcon,
  successStandardIcon,
  plusIcon,
  noteIcon,
  trashIcon,
  pencilIcon,
  networkGlobeIcon,
  timesIcon,
  plusCircleIcon,
  minusCircleIcon,
  cpuIcon,
  memoryIcon,
  viewListIcon,
  importIcon
);


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    NavComponent,
    ClusterComponent,
    PackedbubbleComponent,
    HarborSettingComponent,
    LoginComponent,
    HistogramComponent,
    LineComponent,
    NamespaceComponent,
    ReportViewDetailComponent,
    ReportViewComponent,
    InsightComponent,
    ClusterPageComponent,
    NamespacePageComponent,
    WorkloadPageComponent,
    WorkloadDetailComponent,
    PolicyComponent,
    CornScheduleComponent,
    TimePickerComponent,
    ClusterLineComponent,
    NamesapcePolarComponent,
    NamesapceHistogramComponent,
    DgFilterComponent,
    HarborSettingPageComponent,
    PolicySettingPageComponent,
    KubeBenchReportListComponent,
    KubeBenchReportTestViewComponent,
    KubeBenchReportTestDetailComponent,
    KubeBenchReportComponent,
    RiskReportViewComponent,
    RiskReportDetailComponent,
    VacComponent,
    VacSettingComponent,
    DoshboardComponent,
    TrivyViewComponent,
    TrivyViewDetailComponent,
    SecretComponent,
    CacheComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ClarityModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => {
          return new TranslateHttpLoader(http, '../assets/i18n/', '.json')
        },
        deps: [HttpClient]
      },
    }),
  ],
  providers: [
    AppService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
