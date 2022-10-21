import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DgFilterComponent } from './dg-filter.component';

describe('DgFilterComponent', () => {
  let component: DgFilterComponent;
  let fixture: ComponentFixture<DgFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DgFilterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DgFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
