import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core'
import { IconRegistryService } from './icon-registry.service'

function registerIcons(registry: IconRegistryService) {
  const register = (name: string, url: string) => {
    registry.register(name, url)
  }

  // Zentrale Registrierung aller benutzten Icons
  register('calendar', '/svg/calendar.svg')
  register('location', '/svg/location.svg')
  register('price', '/svg/price.svg')
  register('organizer', '/svg/organizer.svg')
  register('mail', '/svg/mail.svg')
  register('phone', '/svg/phone.svg')
  register('home', '/svg/home.svg')
  register('favourites', '/svg/favourites.svg')
  register('search', '/svg/search.svg')
  register('more', '/svg/more.svg')
  register('chevron-right', '/svg/chevron-right.svg')
  register('share', '/svg/share.svg')
  register('cal-share', '/svg/cal-share.svg')

  // More-Menü Icons
  register('users', '/svg/users.svg')
  register('info-circle', '/svg/info-circle.svg')
  register('shield-check', '/svg/shield-check.svg')
  register('key', '/svg/key.svg')
}

export function provideAppIcons(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [IconRegistryService],
      useFactory: (registry: IconRegistryService) => () => registerIcons(registry),
    },
  ])
}
