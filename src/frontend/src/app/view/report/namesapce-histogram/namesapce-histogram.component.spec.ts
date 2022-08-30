import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamesapceHistogramComponent } from './namesapce-histogram.component';

describe('NamesapceHistogramComponent', () => {
  let component: NamesapceHistogramComponent;
  let fixture: ComponentFixture<NamesapceHistogramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamesapceHistogramComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NamesapceHistogramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
