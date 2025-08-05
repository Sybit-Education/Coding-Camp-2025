import { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { AboutComponent } from './pages/about/about.component'
import { EventCreateComponent } from './pages/event-create/event-create.component'

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
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
    path: 'event/:id',
    loadComponent: () =>
      import('./pages/event-detail/event-detail.component').then(
        (m) => m.EventDetailPageComponent,
      ),
  },
]
