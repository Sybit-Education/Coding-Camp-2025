import { Routes } from '@angular/router'
import { LoginService } from './services/login.service'
import { seoGuard } from './guards/seo.guard'
import { languageGuard } from './guards/language.guard'

export const routes: Routes = [
  {
    path: '',
    canActivate: [languageGuard],
    children: []
  },
  {
    path: ':lang',
    canActivate: [languageGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
        title: 'Startseite',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Startseite - Radolfzell App',
            description: 'Entdecken Sie Veranstaltungen und Aktivitäten in Radolfzell am Bodensee',
            keywords: 'radolfzell,bodensee,veranstaltungen,events',
            type: 'website'
          }
        }
      },
      {
        path: 'favourites',
        loadComponent: () => import('./pages/favourites/favourites.component').then(m => m.FavouritesComponent),
        title: 'Favoriten',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Meine Favoriten - Radolfzell App',
            description: 'Ihre gespeicherten Lieblingsveranstaltungen in Radolfzell am Bodensee',
            keywords: 'favoriten,veranstaltungen,radolfzell,gespeichert',
            type: 'website'
          }
        }
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
        title: 'Über uns',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Über uns - Radolfzell App',
            description: 'Erfahren Sie mehr über die Radolfzell App und ihre Funktionen',
            keywords: 'radolfzell,app,information,über uns',
            type: 'website'
          }
        }
      },
      {
        path: 'create-event',
        loadComponent: () => import('./pages/event-create/event-create.component').then(m => m.EventCreateComponent),
        canActivate: [LoginService, seoGuard],
        title: 'Veranstaltung erstellen',
        data: {
          seo: {
            title: 'Veranstaltung erstellen - Radolfzell App',
            description: 'Erstellen Sie eine neue Veranstaltung in Radolfzell am Bodensee',
            keywords: 'veranstaltung erstellen,event,radolfzell,neu',
            type: 'website'
          }
        }
      },
      {
        path: 'more',
        loadComponent: () => import('./pages/more/more.component').then(m => m.MoreComponent),
        title: 'Mehr',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Mehr Optionen - Radolfzell App',
            description: 'Weitere Funktionen und Informationen zur Radolfzell App',
            keywords: 'mehr,optionen,radolfzell,funktionen',
            type: 'website'
          }
        }
      },
      {
        path: 'team',
        loadComponent: () => import('./pages/devs/devs.component').then(m => m.DevsComponent),
        title: 'Team',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Unser Team - Radolfzell App',
            description: 'Lernen Sie das Team hinter der Radolfzell App kennen',
            keywords: 'team,entwickler,radolfzell,app',
            type: 'website'
          }
        }
      },
      {
        path: 'impressum',
        loadComponent: () => import('./pages/impressum/impressum.component').then(m => m.ImpressumComponent),
        title: 'Impressum',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Impressum - Radolfzell App',
            description: 'Rechtliche Informationen und Impressum der Radolfzell App',
            keywords: 'impressum,rechtlich,radolfzell,kontakt',
            type: 'website'
          }
        }
      },
      {
        path: 'datenschutz',
        loadComponent: () => import('./pages/datenschutz/datenschutz.component').then(m => m.DatenschutzComponent),
        title: 'Datenschutz',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Datenschutz - Radolfzell App',
            description: 'Datenschutzerklärung und Informationen zum Umgang mit Ihren Daten',
            keywords: 'datenschutz,privacy,radolfzell,daten',
            type: 'website'
          }
        }
      },
      {
        path: 'event/:id',
        loadComponent: () => import('./pages/event-detail/event-detail.component').then(m => m.EventDetailPageComponent),
        title: 'Veranstaltungsdetails',
        canActivate: [seoGuard]
        // Keine statischen SEO-Daten, da diese dynamisch in der Komponente gesetzt werden
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginPageComponent),
        title: 'Login',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Login - Radolfzell App',
            description: 'Melden Sie sich an, um alle Funktionen der Radolfzell App zu nutzen',
            keywords: 'login,anmelden,radolfzell,zugang',
            type: 'website'
          }
        }
      },
      {
        path: 'kategorie',
        loadComponent: () => import('./pages/kategorie/kategorie.component').then(m => m.KategorieComponent),
        title: 'Kategorie',
        canActivate: [seoGuard],
        data: {
          seo: {
            title: 'Kategorien - Radolfzell App',
            description: 'Entdecken Sie Veranstaltungen nach Kategorien in Radolfzell',
            keywords: 'kategorien,veranstaltungen,radolfzell,filter',
            type: 'website'
          }
        }
      },
      {
        path: '**',
        redirectTo: '',
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'de',
    pathMatch: 'full'
  }
]
