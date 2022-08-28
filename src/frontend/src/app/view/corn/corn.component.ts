/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import * as moment from 'moment'
@Component({
  selector: 'app-corn',
  templateUrl: './corn.component.html',
  styleUrls: ['./corn.component.less']
})
export class CornComponent implements OnInit {
  @Output() setSchedule = new EventEmitter()

  public schedule:any = {
    // secondInfo: '*',
    minuteInfo: '*',
    hourInfo: '*',
    dayInfo: '?',
    monthInfo: '*',
    weekInfo: '*',
    // yearInfo: '*',
  }
  seconds = true
  minutes = false
  hours = false
  day = false
  month = false
  week = false
  year = false
  secondInfo = {
    type: 'per_second',
    list: ['0','1','2','3','4','5','6','7','8','9',10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59],
    from: 1,
    to: 2,
    start: 0,
    every:1,
    startWeek: 1,
    week: 1,
    checked: [] as any[]
  }
  minuteInfo = {
    type: 'per_minute',
    list: ['0','1','2','3','4','5','6','7','8','9',10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59],
    from: 0,
    to: 1,
    start: 0,
    every:1,
    startWeek: 1,
    week: 1,
    checked: [] as any[]
  }
  hourInfo = {
    type: 'per_hour',
    list: ['0','1','2','3','4','5','6','7','8','9',10,11,12,13,14,15,16,17,18,19,20,21,22,23],
    from: 0,
    to: 2,
    start: 0,
    every:1,
    startWeek: 1,
    week: 1,
    checked: [] as any[]
  }
  dayInfo = {
    type: 'not_specify',
    list: ['1','2','3','4','5','6','7','8','9',10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
    from: 1,
    to: 2,
    start: 1,
    every:1,
    startWeek: 1,
    week: 1,
    checked: [] as any[]
  }
  monthInfo = {
    type: 'per_month',
    list: [1,2,3,4,5,6,7,8,9,10,11,12],
    from: 1,
    to: 2,
    start: 1,
    every:1,
    startWeek: 1,
    week: 1,
    checked: [] as any[]
  }
  weekInfo= {
    type: 'per_week',
    list: [1,2,3,4,5,6,7],
    from: 0,
    to: 1,
    start: 0,
    every:1,
    startWeek: 1,
    week: 1,
    checked: [] as any[]
  }
  yearInfo = {
    type: 'per_year',
    from: moment().format("YYYY"),
    to: moment().add(1,'y').format("YYYY"),
    start: 0,
    every:1,
    startWeek: 1,
    week: 1,
    checked: [] as any[]
  }

  get secondInfoCorn () {
    return this.secondInfo.type
  }
  set secondInfoCorn (value) {
    this.sharedCornHandle(value,'secondInfo','per_second')
  }

  get minuteInfoCorn () {
    return this.minuteInfo.type
  }
  set minuteInfoCorn (value) {
    this.sharedCornHandle(value,'minuteInfo','per_minute')
  }

  get hourInfoCorn () {
    return this.hourInfo.type
  }
  set hourInfoCorn (value) {
    this.sharedCornHandle(value,'hourInfo','per_hour')
  }

  get dayInfoCorn () {
    return this.dayInfo.type
  }
  set dayInfoCorn (value) {
    this.sharedCornHandle(value,'dayInfo','per_day')
  }

  get monthInfoCorn () {
    return this.monthInfo.type
  }
  set monthInfoCorn (value) {
    this.sharedCornHandle(value,'monthInfo','per_month')
  }

  get weekInfoCorn () {
    return this.weekInfo.type
  }
  set weekInfoCorn (value) {
    this.sharedCornHandle(value,'weekInfo','per_week')
  }


  get yearInfoCorn () {
    return this.yearInfo.type
  }
  set yearInfoCorn (value) {
    this.sharedCornHandle(value,'yearInfo','per_year')
  }

  constructor() { }

  ngOnInit(): void {
  }


  sharedChangeHandle (event:any,info:'secondInfo'|'minuteInfo'|'hourInfo'|'dayInfo'|'monthInfo'|'weekInfo', num:string|number) {
    if (event.target.checked) {
      this[info].checked.push(num)
      this.schedule[info] = this[info].checked.join(',')
    } else {
      const index = this[info].checked.findIndex(el => el == num)
      this[info].checked.splice(index, 1)
      this.schedule[info] = this[info].checked.join(',')
    }
    this.setSchedule.emit(this.schedule)
  }

  numericalCheck (info:'secondInfo'|'minuteInfo'|'hourInfo'|'dayInfo'|'monthInfo'|'weekInfo'|'yearInfo', key: 'from'|'to'|'start'|'every'|'startWeek'|'week', min:number, max:number) {
    if (this[info][key] <= min) this[info][key] = min
    if (this[info][key] >= max) this[info][key] = max

    switch (key) {
      case 'to':
          if (this[info].from > this[info].to) this[info].to = Number(this[info].from) + 1
          const str1 = this.schedule[info].split('-')
          this.schedule[info] = str1[0]+'-'+this[info][key]
        break;
      case 'from':
          const str2 = this.schedule[info].split('-')
          this.schedule[info] = this[info][key]+'-'+str2[1]
        break;
      case 'start':
        const str3 = this.schedule[info].split('/')
        this.schedule[info] = this[info][key]+'/'+str3[1]
        break;
      case 'every':
        const str4 = this.schedule[info].split('/')
        this.schedule[info] = str4[1]+'/'+this[info][key]
        break;
      case 'startWeek':
        const str5 = this.schedule[info].split('#')
        this.schedule[info] = this[info][key]+'#'+str5[1]
        break;
      case 'week':
        const str6 = this.schedule[info].split('#')
        this.schedule[info] = str6[1]+'#'+this[info][key]
        break;
        default:

        break;
    }
  }

  sharedCornHandle (key:string, infoName: 'secondInfo'|'minuteInfo'|'hourInfo'|'dayInfo'|'monthInfo'|'weekInfo'|'yearInfo', key_value1: string) {
    switch (key) {
      case key_value1:
        this.schedule[infoName] = '*'
        break;
      case 'period':
        this.schedule[infoName] = this[infoName].from +'-'+this[infoName].to 
        break;
      case 'cycle':
        this.schedule[infoName] = this[infoName].start +'/'+this[infoName].every 
        break;
      case 'specify':
        this.schedule[infoName] = ''
        break;
      case 'specify_week':
        this.schedule[infoName] = this[infoName].startWeek+'#'+this[infoName].week
        break;
      case 'not_specify':
        this.schedule[infoName] = '?'
        break;
      default:
        break;
    }
    this[infoName].type = key
  }
}
