import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VacComponent } from './vac.component';

describe('VacComponent', () => {
  let component: VacComponent;
  let fixture: ComponentFixture<VacComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VacComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VacComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
