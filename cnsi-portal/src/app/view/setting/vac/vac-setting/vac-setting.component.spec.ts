import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VacSettingComponent } from './vac-setting.component';

describe('VacSettingComponent', () => {
  let component: VacSettingComponent;
  let fixture: ComponentFixture<VacSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VacSettingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VacSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
