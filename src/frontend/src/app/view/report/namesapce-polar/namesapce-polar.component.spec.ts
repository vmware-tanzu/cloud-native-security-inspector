import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamesapcePolarComponent } from './namesapce-polar.component';

describe('NamesapcePolarComponent', () => {
  let component: NamesapcePolarComponent;
  let fixture: ComponentFixture<NamesapcePolarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamesapcePolarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamesapcePolarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
