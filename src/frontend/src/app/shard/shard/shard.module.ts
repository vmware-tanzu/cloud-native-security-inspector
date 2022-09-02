import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateStore, TranslateModule, TranslateService } from '@ngx-translate/core';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ClarityModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterTestingModule,
    HttpClientTestingModule,
    TranslateModule.forChild({
      extend: true,
    }),
  ],
  providers: [TranslateStore, TranslateService],
  exports: [TranslateModule, HttpClientModule, HttpClientTestingModule, RouterTestingModule]
})
export class ShardTestModule { }
