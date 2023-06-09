import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HarborService } from 'src/app/service/harbor.service';
import { PolicyService } from 'src/app/service/policy.service';
import { ShardService } from 'src/app/service/shard.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { CacheComponent } from './cache.component';

describe('CacheComponent', () => {
  let component: CacheComponent;
  let fixture: ComponentFixture<CacheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CacheComponent ],
      imports: [ShardTestModule, RouterTestingModule, HttpClientTestingModule],
      providers: [ShardService, HarborService, PolicyService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CacheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
