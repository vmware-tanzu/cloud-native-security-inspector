import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { TrivyViewDetailComponent } from 'src/app/view/assements/trivy-view-detail/trivy-view-detail.component'
import * as moment from 'moment';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
@Component({
  selector: 'app-trivy-view',
  templateUrl: './trivy-view.component.html',
  styleUrls: ['./trivy-view.component.less']
})
export class TrivyViewComponent implements OnInit, AfterViewInit {
  @ViewChild('pagination') pagination:any
  @ViewChild('trivyDetail') trivyDetail!: TrivyViewDetailComponent
  // trivyList: any[] = []
  trivyList: any = []

  opensearchInfo: any = {}
  resultData: any[] = []
  resultName = ''
  pageMaxCount = 0
  showDetailFlag = false
  dgLoading = false
  echartsLoading = false
  isOder = false
  currentDetail!: any
  constructor(
    private router:Router,
    public location: Location
  ) { }

  ngOnInit(): void {
    this.getTrivyReport()
  }

  getTrivyReport() {
    const report = sessionStorage.getItem('cnsi-trivy-report')
    if (report) {
      const trivy = JSON.parse(report)
      trivy.generated_at = moment(trivy.generated_at).format('LLL')
      this.trivyList = [trivy]
      this.resultData = trivy.Report.Results
    } else {
      this.router.navigateByUrl('/assessments/report')
    }
  }

  ngAfterViewInit(): void {
    let resizeLeft = 445
    var resize: any = document.getElementById("trivy-resize");
    var left: any = document.getElementById("trivy-left");
    var right: any = document.getElementById("trivy-right");
    var box: any = document.getElementById("trivy-box");
    console.log('init');
    resize.onmousedown = function (e: any) {
        var startX = e.clientX;          
        resize.left = resizeLeft;          
          document.onmousemove = function (e) {
            var endX = e.clientX;
            
            var moveLen = resize.left + (startX - endX);
                          if (moveLen < 995) moveLen = 995;
            if (moveLen > box.clientWidth-55) moveLen = box.clientWidth-55;


            resize.style.left = moveLen;
            resizeLeft = moveLen
            right.style.width = moveLen + "px";
            left.style.width = (box.clientWidth - moveLen - 5) + "px";
        }
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resize.releaseCapture && resize.releaseCapture();
        }
        resize.setCapture && resize.setCapture();
        return false;
    }
  }
  showDetail(detail: any) {
    this.showDetailFlag = true
    this.currentDetail = detail
    console.log('detail', this.currentDetail);
    // setTimeout(() => {
    //   this.trivyDetail.dataSourceHandle()
    // },100);
  }

  hideDetai(event:any) {
    for (let index = 0; index < event.target.classList.length; index++) { 
      if (event.target.classList[index] === 'report-detai-bg' || event.target.classList[index]  === 'report-detai-left') {
        this.showDetailFlag = false
        continue;
      }      
    }
  }

  showResults(report: {Report: {Results: any[], ArtifactName: string}}) {
    this.resultData = report.Report.Results
    
    this.resultName = report.Report.ArtifactName;
  }

  createTimeSort() {}
  pageChange(event: any) {}
}
