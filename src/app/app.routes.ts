import { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { AboutComponent } from './pages/about/about.component'
import { EventCreateComponent } from './pages/event-create/event-create.component'
import { MoreComponent } from './pages/more/more.component'
import { EventDetailPageComponent } from './pages/event-detail/event-detail.component'
import { DevsComponent } from './pages/devs/devs.component'
import { LoginPageComponent } from './pages/login/login.component'
import { ImpressumComponent } from './pages/impressum/impressum.component'
import { DatenschutzComponent } from './pages/datenschutz/datenschutz.component'
import { LoginService } from './services/login.service'
import { KategorieComponent } from './pages/kategorie/kategorie.component'
import { FavouritesComponent } from './pages/favourites/favourites.component'

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'favourites',
    component: FavouritesComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'create-event',
    component: EventCreateComponent,
    canActivate: [LoginService]
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
    path: 'impressum',
    component: ImpressumComponent,
  },
  {
    path: 'datenschutz',
    component: DatenschutzComponent,
  },
  {
    path: 'event/:id',
    component: EventDetailPageComponent,
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'kategorie',
    component: KategorieComponent,
  }
]
