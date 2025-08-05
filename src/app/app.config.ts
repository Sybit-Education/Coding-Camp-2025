import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

import { routes } from './app.routes'

// Factory-Funktion für den TranslateLoader
export function HttpLoaderFactory() {
  return new TranslateHttpLoader()
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: []
        },
        fallbackLang: 'de'
      })
    )
  ],
}
