import { TestBed } from '@angular/core/testing';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { AssessmentService } from './assessment.service';

describe('AssessmentService', () => {
  let service: AssessmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[ ShardTestModule]
    });
    service = TestBed.inject(AssessmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
