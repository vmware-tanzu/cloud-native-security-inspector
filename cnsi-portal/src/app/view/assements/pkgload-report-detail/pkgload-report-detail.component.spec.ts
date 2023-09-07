import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardService } from 'src/app/service/shard.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { PkgloadReportDetailComponent } from './pkgload-report-detail.component';

describe('PkgloadReportDetailComponent', () => {
  let component: PkgloadReportDetailComponent;
  let fixture: ComponentFixture<PkgloadReportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShardTestModule],
      declarations: [ PkgloadReportDetailComponent ],
      providers: [ShardService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PkgloadReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
