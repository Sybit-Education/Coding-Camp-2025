import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { SurrealdbService } from './app/services/surrealdb.service'
import {
  provideAppInitializer,
  inject,
  isDevMode,
  LOCALE_ID,
} from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { appConfig } from './app/app.config'
import localeDe from '@angular/common/locales/de'
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';
import { registerLocaleData } from '@angular/common'
import { EventService } from './app/services/event.service'
import { LocationService } from './app/services/location.service'
import { OrganizerService } from './app/services/organizer.service'
import { TopicService } from './app/services/topic.service'

// Registriere alle unterstützten Locales für Datums- und Zahlenformatierung
registerLocaleData(localeDe)
registerLocaleData(localeEn);
registerLocaleData(localeFr);

bootstrapApplication(AppComponent, {
  providers: [
    // Das LOCALE_ID wird für Angular-interne Formatierungen verwendet
    // Die Standardsprache ist Deutsch, kann aber durch die Sprachumschaltung geändert werden
    { provide: LOCALE_ID, useFactory: () => {
      const savedLang = localStorage.getItem('selectedLanguage');
      switch (savedLang) {
        case 'en': return 'en-GB';
        case 'fr': return 'fr-FR';
        default: return 'de-DE';
      }
    }},
    ...appConfig.providers,
    provideAppInitializer(() => {
      const surrealdb = inject(SurrealdbService)
      inject(EventService)
      inject(LocationService)
      inject(OrganizerService)
      inject(TopicService)
      return surrealdb.initialize()
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
})
