import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Explicitly set all dynamic routes to Server-Side Rendering (no prerendering)
  { path: '', renderMode: RenderMode.Server },
  { path: 'favourites', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'more', renderMode: RenderMode.Server },
  { path: 'team', renderMode: RenderMode.Server },
  { path: 'event/:id', renderMode: RenderMode.Server },
  { path: 'login', renderMode: RenderMode.Server },
  { path: 'kategorie/:slug', renderMode: RenderMode.Server },
  { path: 'event', renderMode: RenderMode.Server },
  { path: 'admin', renderMode: RenderMode.Server },
  { path: 'admin/locations', renderMode: RenderMode.Server },
  { path: 'admin/location/create', renderMode: RenderMode.Server },
  { path: 'admin/location/:id', renderMode: RenderMode.Server },
  { path: 'admin/create', renderMode: RenderMode.Server },
  { path: 'admin/event/:id', renderMode: RenderMode.Server },
  { path: 'offline', renderMode: RenderMode.Server },
  { path: 'admin/organizers', renderMode: RenderMode.Server },
  { path: 'admin/organizer/create', renderMode: RenderMode.Server },
  { path: 'admin/organizer/:id', renderMode: RenderMode.Server },
  { path: '404', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server }
];
