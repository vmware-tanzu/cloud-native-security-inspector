import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { echarts, PieSeriesOption } from 'src/app/shard/shard/echarts';
type ECOption = echarts.ComposeOption<PieSeriesOption>
@Component({
  selector: 'app-kube-bench-report-test-detail',
  templateUrl: './kube-bench-report-test-detail.component.html',
  styleUrls: ['./kube-bench-report-test-detail.component.less']
})
export class KubeBenchReportTestDetailComponent implements OnInit, OnDestroy {

  testId = ''
  report_id = ''
  testInfo: any = {}
  title = ''
  echartsLoading = true
  kubeTestResultList: any[] = []
  // echarts
  myChart!: any
  echartsOption!: ECOption

  constructor(
    private route:ActivatedRoute,
    private router: Router,
    private httpClient: HttpClient
  ) { }

  echartsInit() {
    const chartDom = document.getElementById('test-detail')!;
    this.myChart = echarts.init(chartDom);
  }

  getLocalhostData() {
		this.httpClient.get('/assets/theme/chalk.json').subscribe((data: any) => {
			if (data) {
        echarts.registerTheme('customed', data) 
			}
		})
	}

  ngOnInit(): void {
    this.echartsInit()
    this.route.params.subscribe(
      data => {
        this.testId = data.id
        this.report_id = sessionStorage.getItem('cnsi_report_id') || ''
        const testInfoStr = sessionStorage.getItem(this.testId)
        if (testInfoStr) {
          this.testInfo = JSON.parse(testInfoStr)
          console.log('this.testInfo', this.testInfo);
          
          this.title = this.testInfo.desc
          this.kubeTestResultList = this.testInfo.results
          console.log(this.testInfo);
          // update echarts
          this.echartsOption = {
            tooltip: {
              trigger: 'item'
            },
            legend: {
              top: '5%',
              left: 'center',
              textStyle: {
                color: "#ffffff"
              }
            },
            series: [
              {
                name: 'Access From',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                  borderRadius: 10,
                  borderColor: '#fff',
                  borderWidth: 2
                },
                label: {
                  show: false,
                  position: 'center'
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: '40',
                    fontWeight: 'bold'
                  }
                },
                labelLine: {
                  show: false
                },
                data: [
                  { value: this.testInfo.info, name: 'Inform', label: {color: '#fff'} },
                  { value: this.testInfo.pass, name: 'Passed', label: {color: '#fff'} },
                  { value: this.testInfo.warn, name: 'Warned', label: {color: '#fff'} },
                  { value: this.testInfo.fail, name: 'Failed', label: {color: '#fff'} },
                ]
              }
            ]
          }
          this.echartsOption && this.myChart.setOption(this.echartsOption);
          this.echartsLoading = false      
    
        } else {
          this.router.navigateByUrl('assessments/kube-bench/list')
        }
      }
    )
  }

  ngOnDestroy(): void {
  }

}
