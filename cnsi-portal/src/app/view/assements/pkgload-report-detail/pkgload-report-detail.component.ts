import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pkgload-report-detail',
  templateUrl: './pkgload-report-detail.component.html',
  styleUrls: ['./pkgload-report-detail.component.less']
})
export class PkgloadReportDetailComponent implements OnInit , OnDestroy{

  public pageSizeOptions = [10, 20, 50, 100, 500];
  public workloadInfo!:any
  public showTrustedColumn = false
  showDetailFlag = false
  @Input('currentReportInfo') currentReportInfo: any
  constructor(
    private router: Router
    ) { }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {
  }
}
