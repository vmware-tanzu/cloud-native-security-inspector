import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as echarts from 'echarts';
import { HttpClient } from '@angular/common/http';
type EChartsOption = echarts.EChartsOption;
@Component({
  selector: 'app-kube-bench-report-test-view',
  templateUrl: './kube-bench-report-test-view.component.html',
  styleUrls: ['./kube-bench-report-test-view.component.less']
})
export class KubeBenchReportTestViewComponent implements OnInit, OnDestroy {
  testId = ''
  testInfo: any = {}
  title = ''
  echartsLoading = true
  kubeReportTestList: any[] = []
  // echarts
  myChart!: any
  echartsOption!: EChartsOption

  constructor(
    private route:ActivatedRoute,
    private router: Router,
    private httpClient: HttpClient
  ) { }

  echartsInit() {
    const chartDom = document.getElementById('test-view')!;
    this.myChart = echarts.init(chartDom);
  }

  getLocalhostData() {
		this.httpClient.get('/assets/theme/chalk.json').subscribe((data: any) => {
			if (data) {
        echarts.registerTheme('customed', data) 
			}
		})
	}

  toKubeBenchReportTestResult(kube: any) {
    console.log('kube.id', kube.section);
    
    sessionStorage.setItem('result_'+kube.section, JSON.stringify(kube))
    this.router.navigateByUrl(`assessments/kube-bench/test-detail/${kube.section}`)
  }

  ngOnInit(): void {
    this.echartsInit()
    this.route.params.subscribe(
      data => {
        this.testId = data.id
        const testInfoStr = sessionStorage.getItem(data.id)
        if (testInfoStr) {
          this.testInfo = JSON.parse(testInfoStr)
          this.title = this.testInfo._source.text
          this.kubeReportTestList = this.testInfo._source.tests
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
                  { value: this.testInfo._source.total_info, name: 'Inform', label: {color: '#fff'} },
                  { value: this.testInfo._source.total_pass, name: 'Passed', label: {color: '#fff'} },
                  { value: this.testInfo._source.total_warn, name: 'Warned', label: {color: '#fff'} },
                  { value: this.testInfo._source.total_fail, name: 'Failed', label: {color: '#fff'} },
                ]
              }
            ]
          }
          this.myChart.clear()
          this.echartsOption && this.myChart.setOption(this.echartsOption);
          this.echartsLoading = false      
    
        } else {
          this.router.navigateByUrl('assessments/kube-bench')
        }
      }
    )
  }

  ngOnDestroy(): void {
    sessionStorage.removeItem(this.testId)
  }


}
