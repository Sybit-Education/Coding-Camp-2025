import { Routes } from '@angular/router'
import { LoginService } from './services/login.service'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Startseite',
  },
  {
    path: 'favourites',
    loadComponent: () => import('./pages/favourites/favourites.component').then((m) => m.FavouritesComponent),
    title: 'Favoriten',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: 'Über uns',
  },
  {
    path: 'more',
    loadComponent: () => import('./pages/more/more.component').then((m) => m.MoreComponent),
    title: 'Mehr',
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/devs/devs.component').then((m) => m.DevsComponent),
    title: 'Team',
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
  },
  {
    path: 'kategorie/:slug',
    loadComponent: () => import('./pages/kategorie/kategorie.component').then((m) => m.KategorieComponent),
    title: 'Kategorie',
  },
  {
    path: 'event',
    loadComponent: () => import('./pages/kategorie/kategorie.component').then((m) => m.KategorieComponent),
    title: 'Alle Veranstaltungen',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-event-overview/admin-event-overview.component').then((m) => m.AdminEventOverviewComponent),
    canActivate: [LoginService],
    title: 'Admin: Veranstaltungen',
  },
  {
    path: 'admin/locations',
    loadComponent: () =>
      import('./pages/admin-location-overview/admin-location-overview.component').then((m) => m.AdminLocationOverviewComponent),
    canActivate: [LoginService],
    title: 'Admin: Orte',
  },
  {
    path: 'admin/location/create',
    loadComponent: () => import('./pages/location-edit/location-edit.component').then((m) => m.LocationEditComponent),
    canActivate: [LoginService],
    title: 'Ort erstellen',
  },
  {
    path: 'admin/location/:id',
    loadComponent: () => import('./pages/location-edit/location-edit.component').then((m) => m.LocationEditComponent),
    canActivate: [LoginService],
    title: 'Ort bearbeiten',
  },
  {
    path: 'admin/create',
    loadComponent: () => import('./pages/event-create/event-create.component').then((m) => m.EventCreateComponent),
    canActivate: [LoginService],
    title: 'Veranstaltung erstellen',
  },
  {
    path: 'admin/event/:id',
    loadComponent: () => import('./pages/event-create/event-create.component').then((m) => m.EventCreateComponent),
    canActivate: [LoginService],
    title: 'Veranstaltung bearbeiten',
  },
  {
    path: 'offline',
    loadComponent: () => import('./pages/offline/offline.component').then((m) => m.OfflineComponent),
    title: 'Offline',
  },
  {
    path: 'admin/organizers',
    loadComponent: () =>
      import('./pages/admin-organizer-overview/admin-organizer-overview.component').then(
        (m) => m.AdminOrganizerOverviewComponent,
      ),
    canActivate: [LoginService],
    title: 'Admin: Veranstalter',
  },
  {
    path: 'admin/organizer/create',
    loadComponent: () => import('./pages/organizer-edit/organizer-edit.component').then((m) => m.OrganizerEditComponent),
    canActivate: [LoginService],
    title: 'Veranstalter erstellen',
  },
  {
    path: 'admin/organizer/:id',
    loadComponent: () => import('./pages/organizer-edit/organizer-edit.component').then((m) => m.OrganizerEditComponent),
    canActivate: [LoginService],
    title: 'Veranstalter bearbeiten',
  },
  {
    path: '404',
    loadComponent: () => import('./pages/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
    title: '404 - Seite nicht gefunden',
  },
  {
    path: '**',
    redirectTo: '404',
  },
]
