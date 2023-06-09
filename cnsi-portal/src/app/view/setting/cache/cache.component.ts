import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HarborService } from 'src/app/service/harbor.service';

@Component({
  selector: 'app-cache',
  templateUrl: './cache.component.html',
  styleUrls: ['./cache.component.less']
})
export class CacheComponent implements OnInit {
  public cacheList: any[]= []
  public deleteModal = false
  public messageFlag = false
  public cacheLoading = false
  public messageContent = ''
  public settingList: any[] = []
  public deleteCacheSettingInfo: any = {}

  constructor(
    private harborService: HarborService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getCache()
  }

  getCache(){
    this.cacheLoading = true
    this.cacheList = []
    this.settingList = []
    this.harborService.getHarborSetting().subscribe(
      data => {
        data.items.forEach((item: any) => {
          this.settingList.push(item)
          if (item.spec.cache) {
            this.cacheList.push({
              address: item.spec.cache.address,
              livingTime: item.spec.cache.settings.livingTime,
              skipTLSVerify: item.spec.cache.settings.skipTLSVerify,
            })
          }
        });
        this.cacheLoading = false
      },
      err => {
        this.cacheLoading = false
      }
    )
  }

  modifyCache() {
    this.router.navigateByUrl('/modify-cache/update')
  }

  deleteModalHandler(index: number) {
    this.deleteCacheSettingInfo = this.settingList[index]
    this.deleteModal = true
  }

  deleteCache() {
    delete this.deleteCacheSettingInfo.spec.cache
    this.harborService.updateHarborSetting(this.deleteCacheSettingInfo.metadata.name, this.deleteCacheSettingInfo).subscribe(
      data => {
        this.getCache()
        this.deleteModal = false
        this.deleteCacheSettingInfo = {}
      },
      err => {
        this.messageFlag = true
        this.messageContent = err.error?.message || 'VAC delete failed!'
      }
    )

  }
}
