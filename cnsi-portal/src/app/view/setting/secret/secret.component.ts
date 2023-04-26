import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SecretModel } from 'src/app/service/harbor-model-type';
import { HarborService } from 'src/app/service/harbor.service';
import { ShardService } from 'src/app/service/shard.service';

@Component({
  selector: 'app-secret',
  templateUrl: './secret.component.html',
  styleUrls: ['./secret.component.less']
})
export class SecretComponent implements OnInit {
  public secretsList: SecretModel[] = []
  public secretLoading = false
  public secretForm!: UntypedFormGroup;
  public messageHarborFlag = false;
  public secretModalFlag = false
  public deleteModal = false
  public messageSecretFlag = ''
  public messageContent = ''

  constructor(
    private formBuilder: UntypedFormBuilder,
    private harborService: HarborService,
    public shardService: ShardService,
    ) {
    this.secretForm = this.formBuilder.group({
      secret_type: ['harbor'],
      secret_accessKey: ['', Validators.required],
      secret_accessSecret: ['', Validators.required],
      secret_name: ['',Validators.required], 
      secret_namespace: {value: 'default', disabled: true},
      secret_token: ['']
    })
  }
  get isHarborSecret() {
    return this.secretForm.get('secret_type')?.value === 'harbor'
  }

  ngOnInit(): void {
    this.getSecrets()
  }

  // secret func
  getSecrets() {
    this.secretLoading = true
    this.harborService.getHarborSecretsSetting().subscribe(
      data => {
        this.secretsList = data.items
        this.secretLoading = false
      }
    )
  }

  createSecret(){
    if (!this.secretForm.get('secret_name')?.valid){
      this.messageSecretFlag='fail'
      this.messageContent = 'Check failed!'
      return 
    }
    const secret: SecretModel = {
      data: {
      },
      kind: 'Secret',
      metadata: {
        name: this.secretForm.get('secret_name')?.value,
        namespace: this.secretForm.get('secret_namespace')?.value,
        annotations: {
          type: this.secretForm.get('secret_type')?.value
        }
      },
      type: 'Opaque'
    }

    if (this.secretForm.get('secret_type')?.value === 'harbor') {
      secret.data.accessKey = window.btoa(this.secretForm.get('secret_accessKey')?.value),
      secret.data.accessSecret = window.btoa(this.secretForm.get('secret_accessSecret')?.value)
    } else {
      secret.data.API_TOKEN = window.btoa(this.secretForm.get('secret_token')?.value)
    }
    
    this.harborService.postHarborSecretsSetting(secret.metadata.namespace, secret).subscribe(
      data => {
        this.messageSecretFlag = 'success'
        this.secretModalFlag=false
        this.getSecrets()
      },
      err => {
        this.messageSecretFlag = 'fail'
        this.messageContent = err.error.message || 'Secret created fail!'
      }
    )
  }
}
