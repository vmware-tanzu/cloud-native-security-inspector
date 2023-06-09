import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HarborService } from 'src/app/service/harbor.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { CacheSettingComponent } from './cache-setting.component';

describe('CacheSettingComponent', () => {
  let component: CacheSettingComponent;
  let fixture: ComponentFixture<CacheSettingComponent>;
  let harborService: HarborService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CacheSettingComponent ],
      imports: [ShardTestModule, RouterTestingModule, HttpClientTestingModule],
      providers: [ShardService, HarborService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CacheSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    harborService = TestBed.inject(HarborService);

  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
