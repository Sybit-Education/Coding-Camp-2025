import { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { AboutComponent } from './pages/about/about.component'
import { EventCreateComponent } from './pages/event-create/event-create.component'
import { MoreComponent } from './pages/more/more.component'
import { PlaceholderComponent } from './pages/placeholder/placeholder.component'
import { EventDetailPageComponent } from './pages/event-detail/event-detail.component'
import { DevsComponent } from './pages/devs/devs.component'
import { LoginPageComponent } from './pages/login/login.component'
import { ImpressumComponent } from './pages/impressum/impressum.component'

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'favourites',
    component: AboutComponent,
  },
  {
    path: 'search',
    component: AboutComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'create-event',
    component: EventCreateComponent,
  },
  {
    path: 'more',
    component: MoreComponent,
  },
  {
    path: 'team',
    component: DevsComponent,
  },
  {
    path: 'sponsor',
    component: PlaceholderComponent,
  },
  {
    path: 'impressum',
    component: ImpressumComponent,
  },
  {
    path: 'datenschutz',
    component: PlaceholderComponent,
  },
  {
    path: 'event/:id',
    component: EventDetailPageComponent,
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
]
