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
import { ReportViewDetailComponent } from './view/tabs/report-view-detail/report-view-detail.component';
import { ReportViewComponent } from './view/tabs/report-view/report-view.component';
import { InsightComponent } from './view/insight/insight.component';
import { ClusterPageComponent } from './view/insight/cluster-page/cluster-page.component';
import { NamespacePageComponent } from './view/insight/namespace-page/namespace-page.component';
import { WorkloadPageComponent } from './view/insight/workload-page/workload-page.component';
import { WorkloadDetailComponent } from './view/insight/workload-detail/workload-detail.component';
import { PolicyComponent } from './view/policy/policy.component';
import { CornScheduleComponent } from './components/corn-schedule/corn-schedule.component';
import { TimePickerComponent } from './components/time-picker/time-picker.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { AppService, createTranslateLoader } from './app.service'
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
    TimePickerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ClarityModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({// 配置i8n
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
  ],
  providers: [
    AppService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
