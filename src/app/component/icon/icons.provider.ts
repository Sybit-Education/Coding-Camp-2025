import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core'
import { IconRegistryService } from '../../services/icon-registry.service'

function registerIcons(registry: IconRegistryService) {
  const register = (name: string, url: string) => {
    registry.register(name, url)
  }

  // Zentrale Registrierung aller benutzten Icons
  register('back', '/svg/back.svg')
  register('calendar', '/svg/calendar.svg')
  register('location', '/svg/location.svg')
  register('price', '/svg/price.svg')
  register('money_bag', '/svg/money_bag.svg')
  register('person', '/svg/person.svg')
  register('mail', '/svg/mail.svg')
  register('call', '/svg/call.svg')

  register('chevron-right', '/svg/chevron-right.svg')
  register('share', '/svg/share.svg')
  register('ios-share', '/svg/ios-share.svg')
  register('cal-share', '/svg/cal-share.svg')
  register('event_upcoming', '/svg/event_upcoming.svg')
  register('pan_zoom', '/svg/pan_zoom.svg')
  register('arrow_back', '/svg/arrow_back.svg')
  register('arrow_forward', '/svg/arrow_forward.svg')
  register('instagram', '/svg/instagram.svg')
  register('close', '/svg/close.svg')

  // Navigation Bar
  register('home', '/svg/home.svg')
  register('favourites', '/svg/favourites.svg')
  register('favourite_filled', '/svg/favourite_filled.svg')
  register('star', '/svg/star.svg')
  register('search', '/svg/search.svg')
  register('view_cozy', '/svg/view_cozy.svg')
  register('more', '/svg/more.svg')
  register('add', '/svg/add.svg')
  register('create_event', '/svg/add.svg')

  // More-Menü Icons
  register('users', '/svg/users.svg')
  register('info-circle', '/svg/info-circle.svg')
  register('shield-check', '/svg/shield-check.svg')
  register('key', '/svg/key.svg')

  // Filter Icons
  register('filter', '/svg/filter.svg')
  register('filter-off', '/svg/filter-off.svg')
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
