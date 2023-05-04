import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretComponent } from './secret.component';
import { HarborService } from 'src/app/service/harbor.service';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

describe('SecretComponent', () => {
  let component: SecretComponent;
  let fixture: ComponentFixture<SecretComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecretComponent ],
      imports: [ShardTestModule],
      providers: [HarborService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecretComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
