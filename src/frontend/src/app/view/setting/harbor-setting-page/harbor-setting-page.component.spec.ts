import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HarborSettingPageComponent } from './harbor-setting-page.component';

describe('HarborSettingPageComponent', () => {
  let component: HarborSettingPageComponent;
  let fixture: ComponentFixture<HarborSettingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HarborSettingPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HarborSettingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
