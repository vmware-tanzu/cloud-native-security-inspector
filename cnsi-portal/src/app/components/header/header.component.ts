/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/app.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {
  langFlag: boolean = false

  constructor(public i18: AppService) { }

  ngOnInit(): void {
    const lang = localStorage.getItem('tsi-language')
    if (lang) {
      // this.i18.lang = lang;      
    }
  }
 //Trigger language dropdown menu
  languageDropdown() {
    this.langFlag = !this.langFlag;
  }
}
