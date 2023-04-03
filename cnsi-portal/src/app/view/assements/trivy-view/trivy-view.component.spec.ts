import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrivyViewComponent } from './trivy-view.component';

describe('TrivyViewComponent', () => {
  let component: TrivyViewComponent;
  let fixture: ComponentFixture<TrivyViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrivyViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrivyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
