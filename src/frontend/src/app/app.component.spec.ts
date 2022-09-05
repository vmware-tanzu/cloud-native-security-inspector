import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';
import { APP_BASE_HREF } from '@angular/common';
import { ShardTestModule } from 'src/app/shard/shard/shard.module';

describe('AppComponent', () => {
    let fixture: ComponentFixture<any>;
    let compiled: any;
    const fakeCookieService = null;
    let fakeSessionService = {
        getCurrentUser: function () {
            return { has_admin_role: true };
        },
    };
    let fakeAppConfigService = {
        isIntegrationMode: function () {
            return true;
        },
    };
    let fakeTitle = {
        setTitle: function () {},
    };
    const fakeSkinableConfig = {
        getSkinConfig() {
            return {
                headerBgColor: {
                    darkMode: '',
                    lightMode: '',
                },
                loginBgImg: '',
                loginTitle: '',
                product: {
                    name: 'test',
                    logo: '',
                    introduction: '',
                },
            };
        },
        setTitleIcon() {},
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AppComponent],
            imports: [ShardTestModule],
            providers: [
                { provide: APP_BASE_HREF, useValue: '/' },
                { provide: Title, useValue: fakeTitle },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        });

        fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        compiled = fixture.nativeElement;
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create the app', () => {
        expect(compiled).toBeTruthy();
    });
});
