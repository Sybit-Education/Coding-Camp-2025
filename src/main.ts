import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { SurrealdbService } from './app/services/surrealdb.service'
import { provideAppInitializer, inject, isDevMode } from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { provideRouter } from '@angular/router'
import { routes } from './app/app.routes'
import { EventService } from './app/services/event.service'
import { LocationService } from './app/services/location.service'
import { OrganizerService } from './app/services/organizer.service'
import { TopicService } from './app/services/topic.service'
import { MediaService } from './app/services/media.service'

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAppInitializer(() => {
      const surrealdb = inject(SurrealdbService)
      inject(EventService)
      inject(LocationService)
      inject(OrganizerService)
      inject(TopicService)
      inject(MediaService)
      return surrealdb.initialize()
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
})
