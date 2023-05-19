import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HarborModel, SecretModel } from 'src/app/service/harbor-model-type';
import { HarborService } from 'src/app/service/harbor.service';

@Component({
  selector: 'app-cache-setting',
  templateUrl: './cache-setting.component.html',
  styleUrls: ['./cache-setting.component.less']
})
export class CacheSettingComponent implements OnInit {

  cacheForm!: UntypedFormGroup;
  public text = ''
  public vacSecretsList: SecretModel[] = []
  public settingInfo!:HarborModel
  messageHarborFlag = ''
  messageContent = ''
  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private harborService: HarborService
  ) { 
    this.cacheForm = this.formBuilder.group({
      cache: this.formBuilder.group({
        address: [''],
        livingTime: [0],
        setting_skipTLSVerify: [true],
      })
    })
  }
  get cacheValid() {
    if (this.cacheForm.controls['cache']?.get('address')?.value) {
      return false
    } else {
      return true
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(
      data => {
        this.text = data.id
        if (!this.text) {
          this.router.navigateByUrl('/vac')
        }
        this.getHarbor()
      }
    )
  }

  getHarbor(){
    this.harborService.getHarborSetting().subscribe(
      data => {
        if (data.items && data.items.length > 0) {
          this.settingInfo = data.items[0];
          const cache = this.settingInfo.spec.cache
          if (cache) {
            this.cacheForm.controls['cache'].get('address')?.setValue(cache.address)
            this.cacheForm.controls['cache'].get('livingTime')?.setValue(cache.settings.livingTime)
            this.cacheForm.controls['cache'].get('setting_skipTLSVerify')?.setValue(cache.settings.skipTLSVerify)
          }
        } else {
          this.router.navigateByUrl('data-source/vac')
        }
      }
    )
  }

  sumbitCache() {
    if (this.settingInfo) {
      this.settingInfo.spec.cache = {
        address: this.cacheForm.get('cache')?.get('address')?.value,
        kind: 'Redis',
        settings: {
          livingTime: this.cacheForm.get('cache')?.get('livingTime')?.value,
          skipTLSVerify: this.cacheForm.get('cache')?.get('setting_skipTLSVerify')?.value
        }
      }
      this.harborService.updateHarborSetting(this.settingInfo.metadata.name, this.settingInfo).subscribe(
        data => {
          this.messageHarborFlag = 'success'
          this.router.navigateByUrl('setting/cache')
        },
        err => {
          this.messageHarborFlag = 'fail'
          this.messageContent = err.error?.message || 'VAC delete failed!'
        }
      )
    }
  }
}
