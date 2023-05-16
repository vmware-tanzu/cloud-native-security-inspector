import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';

import { SecretComponent } from './secret.component';
import { HarborService } from 'src/app/service/harbor.service';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';
import { of, throwError } from 'rxjs';

describe('SecretComponent', () => {
  let component: SecretComponent;
  let fixture: ComponentFixture<SecretComponent>;
  let harborService: HarborService
  const cnsiServiceStub = {
    getHarborSecretsSetting() {
      return of({
        items: []
      })
    },
    postHarborSecretsSetting() {
      return of({
        items: []
      })
    },
    postHarborSecretsSettingError() {
      return throwError('test')
    },
    
  }
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
    harborService = TestBed.inject(HarborService);

  });


  describe('functions ', () => {
    it('getHarborSecretsSetting', fakeAsync(() => {
      spyOn(harborService, 'getHarborSecretsSetting').and.returnValue(
        cnsiServiceStub.getHarborSecretsSetting()
      );
      fixture.detectChanges();
      tick(1500);
      component.getSecrets();

      expect(harborService.getHarborSecretsSetting);
      flush()
    }));
    
    it('createSecret', fakeAsync(() => {
      component.createSecret()
      spyOn(harborService, 'postHarborSecretsSetting').and.returnValue(
        cnsiServiceStub.postHarborSecretsSetting()
      );
      component.secretForm.get('secret_name')?.setValue('test')
      fixture.detectChanges();
      tick(1500);
      component.createSecret();

      expect(harborService.postHarborSecretsSetting);
      flush()
    }));

    it('createSecret', fakeAsync(() => {
      spyOn(harborService, 'postHarborSecretsSetting').and.returnValue(
        cnsiServiceStub.postHarborSecretsSettingError()
      );
      component.secretForm.get('secret_name')?.setValue('test')
      component.secretForm.get('secret_type')?.setValue('vac')
      fixture.detectChanges();
      tick(1500);
      component.createSecret();

      expect(harborService.postHarborSecretsSetting);
      flush()
    }));
  })
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
