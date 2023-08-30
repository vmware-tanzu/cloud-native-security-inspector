import { Component, OnDestroy, OnInit } from '@angular/core';
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
  currentReportInfo!: any
  constructor(
    private router: Router
    ) { }

  ngOnInit(): void {
    this.init()
  }
  init() {
    const detailJSON = sessionStorage.getItem('cnsi-pkgload-report-detail')
    if (detailJSON) {
      this.currentReportInfo = JSON.parse(detailJSON)
    } else {
      this.router.navigateByUrl('/assessments/pkgload')
    }
  }

  ngOnDestroy(): void {
    sessionStorage.removeItem('cnsi-pkgload-report-detail')
  }
}
