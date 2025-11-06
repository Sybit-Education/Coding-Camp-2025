import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core'
import { IconRegistryService } from './icon-registry.service'

function registerIcons(registry: IconRegistryService) {
  const register = (name: string, url: string) => {
    registry.register(name, url)
  }

  // Zentrale Registrierung aller benutzten Icons
  register('calendar', '/icons/calendar.svg')
  register('location', '/icons/location.svg')
  register('price', '/icons/price.svg')
  register('organizer', '/icons/organizer.svg')
  register('mail', '/icons/mail.svg')
  register('phone', '/icons/phone.svg')
  register('home', '/icons/home.svg')
  register('favourites', '/icons/favourites.svg')
  register('search', '/icons/search.svg')
  register('more', '/icons/more.svg')
  register('chevron-right', '/icons/chevron-right.svg')
  register('share', '/icons/share.svg')
  register('cal-share', '/icons/cal-share.svg')

  // More-Menü Icons
  register('users', '/icons/users.svg')
  register('info-circle', '/icons/info-circle.svg')
  register('shield-check', '/icons/shield-check.svg')
  register('key', '/icons/key.svg')
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
