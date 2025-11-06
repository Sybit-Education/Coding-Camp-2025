import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { MatIconRegistry } from '@angular/material/icon'

function registerIcons(registry: MatIconRegistry, sanitizer: DomSanitizer) {
  const register = (name: string, url: string) => {
    registry.addSvgIcon(name, sanitizer.bypassSecurityTrustResourceUrl(url))
  }

  // Zentrale Registrierung aller benutzten Icons
  register('calendar', 'assets/icons/calendar.svg')
  register('home', 'assets/icons/home.svg')
  register('favourites', 'assets/icons/favourites.svg')
  register('search', 'assets/icons/search.svg')
  register('more', 'assets/icons/more.svg')
  register('chevron-right', 'assets/icons/chevron-right.svg')

  // More-Menü Icons
  register('users', 'assets/icons/users.svg')
  register('info-circle', 'assets/icons/info-circle.svg')
  register('shield-check', 'assets/icons/shield-check.svg')
  register('key', 'assets/icons/key.svg')
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
