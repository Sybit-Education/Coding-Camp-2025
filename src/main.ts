import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { SurrealdbService } from './app/services/surrealdb.service'
import {
  provideAppInitializer,
  inject,
  isDevMode,
  LOCALE_ID,
  enableProdMode,
  provideZonelessChangeDetection,
  ApplicationConfig,
} from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { appConfig } from './app/app.config'
import localeDe from '@angular/common/locales/de'
import localeEn from '@angular/common/locales/en'
import localeFr from '@angular/common/locales/fr'
import { registerLocaleData } from '@angular/common'
import { EventService } from './app/services/event.service'
import { LocationService } from './app/services/location.service'
import { OrganizerService } from './app/services/organizer.service'
import { TopicService } from './app/services/topic.service'
import { MediaService } from './app/services/media.service'
import { environment } from './environments/environment'
import { FavoriteService } from '@app/services/favorite.service'
import { LoginService } from '@app/services/login.service'

console.log(
  `App is running in ${environment.configName || 'development'} mode.`,
)

// Aktiviere Produktionsmodus, wenn nicht in Entwicklung
if (environment.production) {
  enableProdMode()
}

// Registriere alle unterstützten Locales für Datums- und Zahlenformatierung
registerLocaleData(localeDe)
registerLocaleData(localeEn)
registerLocaleData(localeFr)

// Erweitere die App-Konfiguration mit zusätzlichen Providern
const bootstrapConfig: ApplicationConfig = {
  providers: [
    // Aktiviere zoneless Change Detection als ersten Provider
    // Wichtig: Dies muss vor allen anderen Providern stehen
    provideZonelessChangeDetection(),
    // Füge die restlichen Provider hinzu
    ...appConfig.providers,
    // Das LOCALE_ID wird für Angular-interne Formatierungen verwendet
    // Die Standardsprache ist Deutsch, kann aber durch die Sprachumschaltung geändert werden
    {
      provide: LOCALE_ID,
      useFactory: () => {
        const savedLang = localStorage.getItem('selectedLanguage')
        switch (savedLang) {
          case 'en':
            return 'en-GB'
          case 'fr':
            return 'fr-FR'
          default:
            return 'de-DE'
        }
      },
    },
    provideAppInitializer(async () => {
      const surrealdb = inject(SurrealdbService)
      const loginService = inject(LoginService)
      const topicService = inject(TopicService)
      const eventService = inject(EventService)
      const favoriteService = inject(FavoriteService)

      inject(LocationService)
      inject(OrganizerService)
      inject(MediaService)

      await eventService.initializeData()
      await topicService.initializeData()
      await favoriteService.initializeData()
      await loginService.checkInitialLoginState()

      return await surrealdb.initialize()
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}

bootstrapApplication(AppComponent, bootstrapConfig).catch((err) =>
  console.error('Error bootstrapping app:', err),
)
