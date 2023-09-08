import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShardService } from 'src/app/service/shard.service';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

import { PkgloadReportComponent } from './pkgload-report.component';

describe('PkgloadReportComponent', () => {
  let component: PkgloadReportComponent;
  let fixture: ComponentFixture<PkgloadReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShardTestModule],
      declarations: [ PkgloadReportComponent ],
      providers: [ShardService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PkgloadReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
