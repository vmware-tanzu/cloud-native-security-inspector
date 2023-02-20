/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core'
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class AppService {
  public lang = 'en'
  public langList = ['en', 'zh_CN']
  constructor(public translate: TranslateService) {
    this.translate.addLangs(this.langList)
    this.translate.setDefaultLang(this.lang)
    this.translate.use(this.lang)
  }
  changeLanguage(lang: string) {
    this.lang = lang
    this.translate.setDefaultLang(this.lang)
    this.translate.use(this.lang)
    localStorage.setItem('tsi-language', lang)
  }
}

