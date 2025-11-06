import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { MatIconRegistry } from '@angular/material/icon'

function registerIcons(registry: MatIconRegistry, sanitizer: DomSanitizer) {
  const register = (name: string, url: string) => {
    registry.addSvgIcon(name, sanitizer.bypassSecurityTrustResourceUrl(url))
  }

  // Zentrale Registrierung aller benutzten Icons
  register('calendar', '/icons/calendar.svg')
  register('home', '/icons/home.svg')
  register('favourites', '/icons/favourites.svg')
  register('search', '/icons/search.svg')
  register('more', '/icons/more.svg')
  register('chevron-right', '/icons/chevron-right.svg')

  // More-Menü Icons
  register('users', '/icons/users.svg')
  register('info-circle', '/icons/info-circle.svg')
  register('shield-check', '/icons/shield-check.svg')
  register('key', '/icons/key.svg')
}

export function provideAppIcons(): EnvironmentProviders {
  return makeEnvironmentProviders([
    MatIconRegistry,
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [MatIconRegistry, DomSanitizer],
      useFactory: (registry: MatIconRegistry, sanitizer: DomSanitizer) => () => registerIcons(registry, sanitizer),
    },
  ])
}
