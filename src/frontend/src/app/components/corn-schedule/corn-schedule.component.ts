/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { TimePickerComponent } from '../time-picker/time-picker.component'
import * as moment from 'moment'
@Component({
  selector: 'app-corn-schedule',
  templateUrl: './corn-schedule.component.html',
  styleUrls: ['./corn-schedule.component.less']
})
export class CornScheduleComponent implements OnInit {
  @Output() saveSchedule = new EventEmitter()
  @Output() cancelSchedule = new EventEmitter()
  @ViewChild('timePicker') timePickerComponent!: TimePickerComponent
  public executeOne = false
  public timeType = true
  public datePicker = moment(Date.now()).format('MM/DD/YYYY')
  public timePicker = '00:00'
  public multipleType = 'day'
  public isDay = true
  public cornType = ''
  public spacedType = 'minute'
  public preValue = ''
  showTimeListFlag = false
  weeks = ['MON','TUE','WED','THU','FRI','SAT','SUN']
  days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
  months = [1,2,3,4,5,6,7,8,9,10,11,12]
  executeWeek:number[] = []
  executeMonth:number[] = []
  executeDay:number[] = []
  spaced:any = {
    month: {
      pre: '',
      next: '*'
    },
    week: {
      pre: '',
      next: '*'
    },
    day: {
      pre: '',
      next: '*'
    },
    hour: {
      pre: '',
      next: '*'
    },
    minute: {
      pre: '',
      next: '*'
    },
  }
  get getMultipleType () {
    return this.multipleType
  }
  set getMultipleType (value) {
    if (value === 'day') {
      this.isDay = true
    } else {
      this.isDay = false
    }
    this.multipleType = value
  }
  constructor() { }
  ngOnInit(): void {}
  setTimePicker(timePicker:any) {
    this.timePicker = timePicker.hour.value+':'+timePicker.minute.value
  }
  sharedChangeHandle(event:any,type: 'day'|'week'|'month', item:number) {
    if (event.target.checked) {
      switch (type) {
        case 'day':
          this.executeDay.push(item)
          break;
      
        case 'week':
          this.executeWeek.push(item)
          break;
      
        case 'month':
          this.executeMonth.push(item)
          break;
      
            default:
          break;
      }
    } else {
      switch (type) {
        case 'day':
          const index1 = this.executeDay.findIndex(el => el == item)
          this.executeDay.splice(index1, 1)
          break;
      
        case 'week':
          const index2 = this.executeWeek.findIndex(el => el == item)
          this.executeWeek.splice(index2, 1)
          break;
      
        case 'month':
          const index3 = this.executeMonth.findIndex(el => el == item)
          this.executeMonth.splice(index3, 1)
          break;
      
            default:
          break;
      }
    }
  }

  save(){
    let data = ''
    switch (this.cornType) {
      case 'customize':
        if (this.executeOne) {
          const days = this.datePicker.split('/')
          const times = this.timePicker.split(':')
          if (times[0]) {
            // data = times[0]+times[1]+days[1]+days[0]+'*'
            data = `${times[1]} ${times[0]} ${days[1]} ${days[0]} *`
          } else {
            // data = '*'+'*'+days[1]+days[0]+'*'
            data = `* * ${days[1]} ${days[0]} *`
          }
        } else {
          if (this.timeType) {
            const times = this.timePicker.split(':')
            switch (this.getMultipleType) {
              case 'week':
                let week1 = '*'
                if (this.executeWeek.length > 0) {
                  week1 = this.executeWeek.join(',')
                }
                if (times[0]) {
                  // data = times[0]+times[1]+'*'+'*'+week1
                  data = `${times[1]} ${times[0]} * * ${week1}`
                } else {
                  // data = '*'+'*'+'*'+'*'+week1
                  data = `* * * * week1`
                }
                break;
              case 'day':
                let day1 = '*'
                if (this.executeDay.length > 0) {
                  day1 = this.executeDay.join(',')
                }
                if (times[0]) {
                  // data = times[0]+times[1]+day1+'*'+'*'
                  data = `${times[1]} ${times[0]} ${day1} * *`
                } else {
                  // data = '*'+'*'+day1+'*'+'*'
                  data = `* * ${day1} * *`
                }
                break;
              default:
                let month = '*'
                let day = '*'
                let week = '*'
                if (this.executeMonth.length > 0) {
                  month = this.executeMonth.join(',')
                }
                if (this.executeDay.length > 0) {
                  day = this.executeDay.join(',')
                }
                if (this.executeWeek.length > 0) {
                  week = this.executeWeek.join(',')
                }
                if (times[0]) {
                  // data = times[0]+times[1]+day+month+week
                  data = `${times[1]} ${times[0]} ${day} ${month} ${week}`
                } else {
                  // data = '*'+'*'+day+month+week
                  data = `* * ${day} ${month} ${week}`
                }
                break;
            }
          } else {
            let minute = '';
            let hour = '';
            let day = '';
            let month = '';
            let week = '';
            this.spaced[this.spacedType].pre = this.preValue
            for (const key in this.spaced) {
              switch (key) {
                case 'minute':
                  if (isTrue(this.spaced[key], 'pre')) {
                    minute = this.spaced[key].pre+'/'+this.spaced[key].next
                  } else {
                    minute = '*'
                  }
                  break;
                case 'hour':
                  if (isTrue(this.spaced[key], 'pre')) {
                    hour = this.spaced[key].pre+'/'+this.spaced[key].next
                  } else {
                    hour = '*'
                  }
                  break;
                case 'day':
                  if (isTrue(this.spaced[key], 'pre')) {
                    day = this.spaced[key].pre+'/'+this.spaced[key].next
                  } else {
                    day = '*'
                  }
                  break;
                case 'month':
                  if (isTrue(this.spaced[key], 'pre')) {
                    month = this.spaced[key].pre+'/'+this.spaced[key].next
                  } else {
                    month = '*'
                  }
                  break;
                case 'week':
                  if (isTrue(this.spaced[key], 'pre')) {
                    week = this.spaced[key].pre+'/'+this.spaced[key].next
                  } else {
                    week = '*'
                  }
                  break;
                                  
                default:
                  break;
              }
            }
            // data=minute+hour+day+month+week
            data=`${minute} ${hour} ${day} ${month} ${week}`
          }
        }
        break;
      case 'daily':
        data = '0 0 * * *'
        break
      case 'hourly':
        data = '0 * * * *'
        break
      default:
        data = '0 0 * * 0'
        break;
    }
    this.saveSchedule.emit(data)
  }
  cancel(){
    this.cornType = 'weekly'
    this.timePickerComponent.showTimeListFlag = false
    this.cancelSchedule.emit()
  }

  spacedTypeChange() {
    this.spaced[this.spacedType].pre = this.preValue
  }
}
function isTrue (data:any, key: string):boolean {
  if (data[key]) {
    return true
  } else {
    return false
  }
}