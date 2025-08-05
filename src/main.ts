import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { SurrealdbService } from './app/services/surrealdb.service'
import { provideAppInitializer, inject, isDevMode } from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { appConfig } from './app/app.config'
import { TranslateService } from '@ngx-translate/core'

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,
    provideAppInitializer(() => {
      const surrealdb = inject(SurrealdbService)
      return surrealdb.initialize()
    }),
    provideAppInitializer(() => {
      const translate = inject(TranslateService)
      translate.addLangs(['de', 'en'])
      translate.setDefaultLang('de')
      
      // Browser-Sprache erkennen oder Standardsprache verwenden
      const browserLang = translate.getBrowserLang()
      translate.use(browserLang && ['de', 'en'].includes(browserLang) ? browserLang : 'de')
      
      return Promise.resolve()
    }),
    SurrealdbService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
})


