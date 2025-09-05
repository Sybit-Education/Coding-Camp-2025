import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core'
import { provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules, withViewTransitions } from '@angular/router'
import { provideHttpClient, HttpClient, withInterceptorsFromDi } from '@angular/common/http'
import {
  TranslateLoader,
  TranslateModule,
  Translation,
} from '@ngx-translate/core'
import { Observable } from 'rxjs'
import { provideAnimations } from '@angular/platform-browser/animations'

import { routes } from './app.routes'

// Eigener TranslateLoader, der keine speziellen Tokens benötigt
class CustomTranslateLoader implements TranslateLoader {
  constructor(
    private readonly http: HttpClient,
    private readonly prefix = './assets/i18n/',
    private readonly suffix = '.json',
  ) {}

  getTranslation(lang: string): Observable<Translation> {
    return this.http.get(`${this.prefix}${lang}${this.suffix}`)
  }
}

// Factory-Funktion für den CustomTranslateLoader
export function createTranslateLoader(http: HttpClient) {
  return new CustomTranslateLoader(http, './assets/i18n/', '.json')
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withPreloading(PreloadAllModules)
    ),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
        fallbackLang: 'de',
        isolate: false,
      }),
    ),
  ],
}
