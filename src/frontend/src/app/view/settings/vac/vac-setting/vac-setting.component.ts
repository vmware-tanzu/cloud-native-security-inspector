import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-vac-setting',
  templateUrl: './vac-setting.component.html',
  styleUrls: ['./vac-setting.component.less']
})
export class VacSettingComponent implements OnInit {
  vacForm!: UntypedFormGroup;
  versionList = []
  public text = ''
  messageHarborFlag = ''
  messageContent = ''
  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) { 
    this.vacForm = this.formBuilder.group({
      requiredFields: this.formBuilder.group({
        name: ['',Validators.required],
        branch: ['',Validators.required],
        version: ['',Validators.required]
      }),
      deprecationPolicy: this.formBuilder.group({

      }),
      nonsupportPolicy: this.formBuilder.group({
      })
    })
  }

  ngOnInit(): void {
    this.route.params.subscribe(
      data => {
        this.text = data.id
        if (!this.text) {
          this.router.navigateByUrl('/setting')
        }
      }
    )
  }

  harborHandler(text: any) {}
}
