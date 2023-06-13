import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HarborModel, SecretModel } from 'src/app/service/harbor-model-type';
import { HarborService } from 'src/app/service/harbor.service';

@Component({
  selector: 'app-vac-setting',
  templateUrl: './vac-setting.component.html',
  styleUrls: ['./vac-setting.component.less']
})
export class VacSettingComponent implements OnInit {
  vacForm!: UntypedFormGroup;
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
    this.vacForm = this.formBuilder.group({
      vacDataSource: this.formBuilder.group({
        endpoint: ['',Validators.required],
        cspSecretName: ['',Validators.required],
      })
    })
  }

  ngOnInit(): void {
    this.route.params.subscribe(
      data => {
        this.text = data.id
        if (!this.text) {
          this.router.navigateByUrl('/vac')
        }
        this.getSecrets()
        this.getHarbor()
      }
    )
  }

  get vacDataSourceValid() {
    if (this.vacForm.controls['vacDataSource']?.get('cspSecretName')?.value && this.vacForm.controls['vacDataSource']?.get('endpoint')?.value) {
      return false
    } else {
      return true
    }
  }

  getSecrets() {
    this.harborService.getHarborSecretsSetting().subscribe(
      data => {
        this.vacSecretsList = []
        data.items.forEach((sc: any) => {
          if (sc.metadata.annotations) {
            if (sc.metadata.annotations.type) {
              if (sc.metadata.annotations.type === 'vac') {
                this.vacSecretsList.push(sc)
              }
            } else {
              this.vacSecretsList.push(sc)
              }
          } else {
            this.vacSecretsList.push(sc)
          }
        })
      }
    )
  }

  getHarbor(){
    this.harborService.getHarborSetting().subscribe(
      data => {
        if (data.items && data.items.length > 0) {
          this.settingInfo = data.items[0];
          const vac = this.settingInfo.spec.vacDataSource
          if (vac) {
            this.vacForm.controls['vacDataSource'].get('endpoint')?.setValue(vac.endpoint)
            this.vacForm.controls['vacDataSource'].get('cspSecretName')?.setValue(vac.credentialRef.name)
          }

        } else {
          this.router.navigateByUrl('data-source/vac')
        }
      }
    )
  }

  sumbitVac() {
    if (this.settingInfo) {
      const name = this.vacForm.controls['vacDataSource']?.get('cspSecretName')?.value
      const secret = this.vacSecretsList.find(sc => sc.metadata.name === name)
      if (!secret) return
      this.settingInfo.spec.vacDataSource = {
        endpoint: this.vacForm.controls['vacDataSource']?.get('endpoint')?.value,
        credentialRef: {
          name: secret.metadata.name,
          namespace: secret.metadata.namespace
        }
      }
      this.harborService.updateHarborSetting(this.settingInfo.metadata.name, this.settingInfo).subscribe(
        data => {
          this.messageHarborFlag = 'success'
          this.router.navigateByUrl('data-source/vac')
        },
        err => {
          this.messageHarborFlag = 'fail'
          this.messageContent = err.error?.message || 'VAC delete failed!'
        }
      )
    }
  }
}
