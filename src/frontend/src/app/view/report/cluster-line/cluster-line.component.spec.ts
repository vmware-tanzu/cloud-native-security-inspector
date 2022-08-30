import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterLineComponent } from './cluster-line.component';

describe('ClusterLineComponent', () => {
  let component: ClusterLineComponent;
  let fixture: ComponentFixture<ClusterLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClusterLineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
