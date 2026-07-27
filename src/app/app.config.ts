import { ApplicationConfig, importProvidersFrom } from '@angular/core'
import { A11yModule } from '@angular/cdk/a11y'
import { provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules, withViewTransitions } from '@angular/router'
import { provideHttpClient, HttpClient, withInterceptorsFromDi, withFetch } from '@angular/common/http'
import { provideTranslateService, TranslateLoader, Translation } from '@ngx-translate/core'
import { Observable } from 'rxjs'

import { routes } from './app.routes'
import { provideAppIcons } from './component/icon/icons.provider'

class CustomTranslateLoader implements TranslateLoader {
  constructor(
    private readonly http: HttpClient,
    private readonly prefix = './assets/i18n/',
    private readonly suffix = '.json',
  ) {}

  getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(`${this.prefix}${lang}${this.suffix}`)
  }
}

export function createTranslateLoader(http: HttpClient) {
  return new CustomTranslateLoader(http, './assets/i18n/', '.json')
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withViewTransitions(), withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    provideAppIcons(),

    importProvidersFrom(A11yModule),

    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
      fallbackLang: 'de',
      lang: 'de',
    }),
  ],
}
