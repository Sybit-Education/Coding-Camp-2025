import { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { AboutComponent } from './pages/about/about.component'
import { EventCreateComponent } from './pages/event-create/event-create.component'
import { EventDetailPageComponent } from './pages/event-detail/event-detail.component'
import { DevsComponent } from './pages/devs/devs.component'

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
    component: EventDetailPageComponent,
  },
  {
    path: 'devs',
    component: DevsComponent,
  },
]
