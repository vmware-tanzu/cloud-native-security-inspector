import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CacheSettingComponent } from './cache-setting.component';

describe('CacheSettingComponent', () => {
  let component: CacheSettingComponent;
  let fixture: ComponentFixture<CacheSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CacheSettingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CacheSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
