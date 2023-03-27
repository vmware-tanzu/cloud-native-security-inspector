import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardService } from 'src/app/service/shard.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { NamesapceHistogramComponent } from './namesapce-histogram.component';

describe('NamesapceHistogramComponent', () => {
  let component: NamesapceHistogramComponent;
  let fixture: ComponentFixture<NamesapceHistogramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamesapceHistogramComponent ],
      imports: [ShardTestModule],
      providers: [ShardService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]

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
