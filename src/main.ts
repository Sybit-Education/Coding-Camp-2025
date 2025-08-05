import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { SurrealdbService } from './app/services/surrealdb.service'
import { provideAppInitializer, inject, isDevMode } from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { appConfig } from './app/app.config'

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,
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


