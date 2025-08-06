import { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { AboutComponent } from './pages/about/about.component'
import { MoreComponent } from './pages/more/more.component'
import { PlaceholderComponent } from './pages/placeholder/placeholder.component'

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
    path: 'more',
    component: MoreComponent,
  },
  {
    path: 'team',
    component: PlaceholderComponent,
  },
  {
    path: 'sponsor',
    component: PlaceholderComponent,
  },
  {
    path: 'impressum',
    component: PlaceholderComponent,
  },
  {
    path: 'datenschutz',
    component: PlaceholderComponent,
  },
  {
    path: 'event/:id',
    loadComponent: () =>
      import('./pages/event-detail/event-detail.component').then(
        (m) => m.EventDetailPageComponent,
      ),
  },
]
