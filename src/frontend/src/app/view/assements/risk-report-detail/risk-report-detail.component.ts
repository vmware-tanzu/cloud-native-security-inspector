import { Component, OnInit, Input } from '@angular/core';
@Component({
  selector: 'app-risk-report-detail',
  templateUrl: './risk-report-detail.component.html',
  styleUrls: ['./risk-report-detail.component.less']
})
export class RiskReportDetailComponent implements OnInit {
  @Input('detailInfo') detailInfo!: any
  constructor() { }

  ngOnInit(): void {    
  }

}
