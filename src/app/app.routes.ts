import { Routes } from '@angular/router'
import { LoginService } from './services/login.service'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Startseite',
  },
  {
    path: 'favourites',
    loadComponent: () =>
      import('./pages/favourites/favourites.component').then(
        (m) => m.FavouritesComponent,
      ),
    title: 'Favoriten',
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: 'Über uns',
  },
  {
    path: 'more',
    loadComponent: () =>
      import('./pages/more/more.component').then((m) => m.MoreComponent),
    title: 'Mehr',
  },
  {
    path: 'team',
    loadComponent: () =>
      import('./pages/devs/devs.component').then((m) => m.DevsComponent),
    title: 'Team',
  },
  {
    path: 'event/:id',
    loadComponent: () =>
      import('./pages/event-detail/event-detail.component').then(
        (m) => m.EventDetailPageComponent,
      ),
    title: 'Veranstaltungsdetails',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginPageComponent),
    title: 'Login',
  },
  {
    path: 'kategorie',
    loadComponent: () =>
      import('./pages/kategorie/kategorie.component').then(
        (m) => m.KategorieComponent,
      ),
    title: 'Kategorie',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import(
        './pages/admin-event-overview/admin-event-overview.component'
      ).then((m) => m.AdminEventOverviewComponent),
    canActivate: [LoginService],
    title: 'Admin: Veranstaltungen',
  },
  {
    path: 'admin/create',
    loadComponent: () =>
      import('./pages/event-create/event-create.component').then(
        (m) => m.EventCreateComponent,
      ),
    canActivate: [LoginService],
    title: 'Veranstaltung erstellen',
  },
  {
    path: 'admin/event/:id',
    loadComponent: () =>
      import('./pages/event-create/event-create.component').then(
        (m) => m.EventCreateComponent,
      ),
    canActivate: [LoginService],
    title: 'Veranstaltung erstellen',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import(
        './pages/admin-event-overview/admin-event-overview.component'
      ).then((m) => m.AdminEventOverviewComponent),
    canActivate: [LoginService],
    title: 'Admin: Veranstaltungen',
  },
  {
    path: 'admin/create',
    loadComponent: () =>
      import('./pages/event-create/event-create.component').then(
        (m) => m.EventCreateComponent,
      ),
    canActivate: [LoginService],
    title: 'Veranstaltung erstellen',
  },
  {
    path: 'admin/event/:id',
    loadComponent: () =>
      import('./pages/event-create/event-create.component').then(
        (m) => m.EventCreateComponent,
      ),
    canActivate: [LoginService],
    title: 'Veranstaltung erstellen',
  },
  {
    path: '**',
    redirectTo: '',
  },
]
