import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicySettingPageComponent } from './policy-setting-page.component';

describe('PolicySettingPageComponent', () => {
  let component: PolicySettingPageComponent;
  let fixture: ComponentFixture<PolicySettingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolicySettingPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolicySettingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
