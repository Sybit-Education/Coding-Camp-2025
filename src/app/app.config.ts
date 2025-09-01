import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  APP_INITIALIZER
} from '@angular/core'
import { 
  provideRouter, 
  withComponentInputBinding, 
  withPreloading, 
  PreloadAllModules, 
  withViewTransitions,
  withInMemoryScrolling,
  withDebugTracing
} from '@angular/router'
import { 
  provideHttpClient, 
  HttpClient, 
  withInterceptorsFromDi, 
  withFetch,
  withJsonpSupport 
} from '@angular/common/http'
import {
  TranslateLoader,
  TranslateModule,
  Translation,
} from '@ngx-translate/core'
import { Observable } from 'rxjs'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideServiceWorker } from '@angular/service-worker'
import { 
  provideClientHydration, 
  withHttpTransferCacheOptions 
} from '@angular/platform-browser'

import { routes } from './app.routes'
import { environment } from '../environments/environment'
import { SeoInitializerService } from './services/seo-initializer.service'

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
    // Wir verwenden keine Zone.js mehr, da wir Signals für Change Detection nutzen
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: (transitionInfo) => {
          console.log('View Transition created:', transitionInfo);
        }
      }),
      withInMemoryScrolling({ 
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      }),
      withPreloading(PreloadAllModules),
      // Debug-Tracing nur in der Entwicklungsumgebung aktivieren
      ...(isDevMode() ? [withDebugTracing()] : [])
    ),
    provideHttpClient(
      withInterceptorsFromDi(),
      withFetch(),
      withJsonpSupport()
    ),
    provideAnimations(),
    provideClientHydration(
      withHttpTransferCacheOptions({
        includePostRequests: true
      })
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
        fallbackLang: 'de',
        isolate: false,
        useDefaultLang: true,
        defaultLanguage: 'de'
      }),
    ),
    // Router-Events für SEO-Metadaten abfangen
    {
      provide: APP_INITIALIZER,
      useFactory: (seoInitializer: SeoInitializerService) => {
        return () => {
          console.log('SEO Initializer aktiviert');
          return true;
        };
      },
      deps: [SeoInitializerService],
      multi: true
    },
  ],
}
