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
import { SettingComponent } from './view/setting/setting.component';
import { LoginComponent } from './view/login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HistogramComponent } from './view/report/histogram/histogram.component';
import { LineComponent } from './view/report/line/line.component';
import { CornComponent } from './view/corn/corn.component'
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
import { HarborSettingPageComponent } from './view/setting/harbor-setting-page/harbor-setting-page.component';
import { PolicySettingPageComponent } from './view/policy/policy-setting-page/policy-setting-page.component';
import { KubeBenchReportListComponent } from './view/assements/kube-bench-report-list/kube-bench-report-list.component';
import { KubeBenchReportTestViewComponent } from './view/assements/kube-bench-report-test-view/kube-bench-report-test-view.component';
import { KubeBenchReportTestDetailComponent } from './view/assements/kube-bench-report-test-detail/kube-bench-report-test-detail.component';
import { KubeBenchReportComponent } from './view/assements/kube-bench-report/kube-bench-report.component';
import { RiskReportViewComponent } from './view/assements/risk-report-view/risk-report-view.component';
import { RiskReportDetailComponent } from './view/assements/risk-report-detail/risk-report-detail.component'
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
  memoryIcon
} from '@cds/core/icon';

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
  memoryIcon
);


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    NavComponent,
    ClusterComponent,
    PackedbubbleComponent,
    SettingComponent,
    LoginComponent,
    HistogramComponent,
    LineComponent,
    CornComponent,
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
    RiskReportDetailComponent
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
