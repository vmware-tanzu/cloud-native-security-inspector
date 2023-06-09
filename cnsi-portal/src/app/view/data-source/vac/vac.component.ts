import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HarborService } from 'src/app/service/harbor.service';
import { PolicyService } from 'src/app/service/policy.service';

@Component({
  selector: 'app-vac',
  templateUrl: './vac.component.html',
  styleUrls: ['./vac.component.less']
})
export class VacComponent implements OnInit {

  public vacLoading = false
  public messageContent = ''
  public deleteModal = false
  public messageFlag = false
  public settingList: any[] = []
  public deleteVacSettingInfo: any = {}

  public vacList: {name: string, namespace: string, endpoint: string, status: string}[] = []
  constructor(
    private harborService: HarborService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getVac()
  }

  getVac(){
    this.vacLoading = true
    this.settingList = []
    this.vacList = []
    this.harborService.getHarborSetting().subscribe(
      data => {
        data.items.forEach((item: any) => {
          this.settingList.push(item)
          if (item.spec.vacDataSource) {
            this.vacList.push({
              name: item.spec.vacDataSource.credentialRef.name,
              namespace: item.spec.vacDataSource.credentialRef.namespace,
              endpoint: item.spec.vacDataSource.endpoint,
              status: item.status.status
            })
          }
        });
        this.vacLoading = false
      },
      err => {
        this.vacLoading = false
      }
    )
  }

  modifyVAC() {
    this.router.navigateByUrl('/modify-vac/update')
  }

  deleteVAC() {
    delete this.deleteVacSettingInfo.spec.vacDataSource
    this.harborService.updateHarborSetting(this.deleteVacSettingInfo.metadata.name, this.deleteVacSettingInfo).subscribe(
      data => {
        this.getVac()
        this.deleteModal = false
        this.deleteVacSettingInfo = {}
      },
      err => {
        this.messageFlag = true
        this.messageContent = err.error?.message || 'VAC delete failed!'
      }
    )

  }

  deleteModalHandler(index: number) {
    this.deleteVacSettingInfo = this.settingList[index]
    this.deleteModal = true
  }
}
