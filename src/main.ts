import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { SurrealdbService } from './app/services/surrealdb.service'
import { provideAppInitializer, inject, isDevMode, LOCALE_ID } from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { provideRouter } from '@angular/router'
import { routes } from './app/app.routes'
import localeDe from '@angular/common/locales/de';
import { registerLocaleData } from '@angular/common'

registerLocaleData(localeDe); // TODO: Change when i18n got implemented - important for date.pipe.ts

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    provideRouter(routes),
    provideAppInitializer(() => {
      const surrealdb = inject(SurrealdbService)
      return surrealdb.initialize()
    }),
    SurrealdbService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
})
