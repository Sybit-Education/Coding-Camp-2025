import { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { AboutComponent } from './pages/about/about.component'
import { LoginComponent } from './pages/login/login.component'

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
    path: 'event/:id',
    loadComponent: () =>
      import('./pages/event-detail/event-detail.component').then(
        (m) => m.EventDetailPageComponent,
      ),
  },
  {
    path: 'login',
    component: LoginComponent,
  },
]
