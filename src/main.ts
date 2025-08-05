import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { SurrealdbService } from './app/services/surrealdb.service'
import { provideAppInitializer, inject, isDevMode } from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { provideRouter } from '@angular/router'
import { routes } from './app/app.routes'
import { EventService } from './app/services/event.service'

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAppInitializer(() => {
      const surrealdb = inject(SurrealdbService)
      return surrealdb.initialize()
    }),
    provideAppInitializer(() => {
      inject(EventService)
    }),
    SurrealdbService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
})
