import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardService } from 'src/app/service/shard.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { NamesapcePolarComponent } from './namesapce-polar.component';

describe('NamesapcePolarComponent', () => {
  let component: NamesapcePolarComponent;
  let fixture: ComponentFixture<NamesapcePolarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamesapcePolarComponent ],
      imports: [ShardTestModule],
      providers: [ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]

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
