import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrivyViewDetailComponent } from './trivy-view-detail.component';

describe('TrivyViewDetailComponent', () => {
  let component: TrivyViewDetailComponent;
  let fixture: ComponentFixture<TrivyViewDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrivyViewDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrivyViewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
