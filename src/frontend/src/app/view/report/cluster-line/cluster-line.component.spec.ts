import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardService } from 'src/app/service/shard.service'
import { ShardTestModule } from 'src/app/shard/shard/shard.module'

import { ClusterLineComponent } from './cluster-line.component';

describe('ClusterLineComponent', () => {
  let component: ClusterLineComponent;
  let fixture: ComponentFixture<ClusterLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClusterLineComponent ],
      imports: [ShardTestModule],
      providers: [ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

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
