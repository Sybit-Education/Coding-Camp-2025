import { Routes } from '@angular/router'
import { LoginService } from './services/login.service'
import { metaGuard } from './services/seo.service'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Startseite',
    data: { meta: { title: 'Startseite', description: 'Entdecke Veranstaltungen zum Jubiläum 1200 Jahre Radolfzell.' } },
    canActivate: [metaGuard],
  },
  {
    path: 'favourites',
    loadComponent: () => import('./pages/favourites/favourites.component').then((m) => m.FavouritesComponent),
    title: 'Favoriten',
    data: { meta: { title: 'Favoriten', description: 'Deine gemerkten Veranstaltungen im Überblick.' } },
    canActivate: [metaGuard],
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: 'Über uns',
    data: { meta: { title: 'Über uns', description: 'Informationen zum Jubiläumsprojekt 1200 Jahre Radolfzell.' } },
    canActivate: [metaGuard],
  },
  {
    path: 'more',
    loadComponent: () => import('./pages/more/more.component').then((m) => m.MoreComponent),
    title: 'Mehr',
    data: { meta: { title: 'Mehr', description: 'Weitere Inhalte und Informationen rund um das Jubiläum.' } },
    canActivate: [metaGuard],
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/devs/devs.component').then((m) => m.DevsComponent),
    title: 'Team',
    data: { meta: { title: 'Team', description: 'Lerne das Team hinter 1200 Jahre Radolfzell kennen.' } },
    canActivate: [metaGuard],
  },
  {
    path: 'event/:id',
    loadComponent: () => import('./pages/event-detail/event-detail.component').then((m) => m.EventDetailPageComponent),
    title: 'Veranstaltungsdetails',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginPageComponent),
    title: 'Login',
    data: { meta: { title: 'Login', description: 'Melde dich an, um Veranstaltungen zu verwalten.' } },
    canActivate: [metaGuard],
  },
  {
    path: 'kategorie',
    loadComponent: () => import('./pages/kategorie/kategorie.component').then((m) => m.KategorieComponent),
    title: 'Kategorie',
    data: { meta: { title: 'Kategorien', description: 'Entdecke Veranstaltungen nach Kategorien.' } },
    canActivate: [metaGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-event-overview/admin-event-overview.component').then((m) => m.AdminEventOverviewComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Admin: Veranstaltungen',
    data: { meta: { title: 'Admin: Veranstaltungen', description: 'Veranstaltungen verwalten.' } },
  },
  {
    path: 'admin/locations',
    loadComponent: () =>
      import('./pages/admin-location-overview/admin-location-overview.component').then((m) => m.AdminLocationOverviewComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Admin: Orte',
    data: { meta: { title: 'Admin: Orte', description: 'Veranstaltungsorte verwalten.' } },
  },
  {
    path: 'admin/location/create',
    loadComponent: () => import('./pages/location-edit/location-edit.component').then((m) => m.LocationEditComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Ort erstellen',
    data: { meta: { title: 'Ort erstellen', description: 'Neuen Veranstaltungsort anlegen.' } },
  },
  {
    path: 'admin/location/:id',
    loadComponent: () => import('./pages/location-edit/location-edit.component').then((m) => m.LocationEditComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Ort bearbeiten',
    data: { meta: { title: 'Ort bearbeiten', description: 'Veranstaltungsort bearbeiten.' } },
  },
  {
    path: 'admin/create',
    loadComponent: () => import('./pages/event-create/event-create.component').then((m) => m.EventCreateComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Veranstaltung erstellen',
    data: { meta: { title: 'Veranstaltung erstellen', description: 'Neue Veranstaltung anlegen.' } },
  },
  {
    path: 'admin/event/:id',
    loadComponent: () => import('./pages/event-create/event-create.component').then((m) => m.EventCreateComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Veranstaltung erstellen',
    data: { meta: { title: 'Veranstaltung erstellen', description: 'Neue oder bestehende Veranstaltung bearbeiten.' } },
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-event-overview/admin-event-overview.component').then((m) => m.AdminEventOverviewComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Admin: Veranstaltungen',
    data: { meta: { title: 'Admin: Veranstaltungen', description: 'Veranstaltungen verwalten.' } },
  },
  {
    path: 'admin/create',
    loadComponent: () => import('./pages/event-create/event-create.component').then((m) => m.EventCreateComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Veranstaltung erstellen',
    data: { meta: { title: 'Veranstaltung erstellen', description: 'Neue Veranstaltung anlegen.' } },
  },
  {
    path: 'admin/event/:id',
    loadComponent: () => import('./pages/event-create/event-create.component').then((m) => m.EventCreateComponent),
    canActivate: [LoginService, metaGuard],
    title: 'Veranstaltung erstellen',
    data: { meta: { title: 'Veranstaltung erstellen', description: 'Neue oder bestehende Veranstaltung bearbeiten.' } },
  },
  {
    path: '**',
    redirectTo: '',
  },
]
