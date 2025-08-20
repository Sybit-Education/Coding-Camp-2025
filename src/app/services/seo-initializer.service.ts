import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SeoService } from './seo.service';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoInitializerService {
  private readonly seoService = inject(SeoService);
  private readonly titleService = inject(Title);

  /**
   * Initialisiert die SEO-Metadaten für jede Route
   * Kann als Resolver oder in einem Guard verwendet werden
   */
  initializeMetaTags(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Hole die SEO-Daten aus den Route-Daten
    const routeData = route.data;
    
    if (routeData && routeData['seo']) {
      // Wenn SEO-Daten in der Route definiert sind, verwende diese
      this.seoService.updateTags(routeData['seo']);
    } else {
      // Fallback: Verwende den Routennamen als Titel
      const title = route.data['title'] || this.getRouteTitle(route);
      
      // Setze Basis-Metadaten
      this.seoService.updateTags({
        title: title,
        description: `Informationen zu ${title} in Radolfzell am Bodensee`,
        type: 'website'
      });
    }
    
    return true;
  }
  
  /**
   * Extrahiert einen sinnvollen Titel aus der Route
   */
  private getRouteTitle(route: ActivatedRouteSnapshot): string {
    // Versuche, einen sinnvollen Titel aus der Route zu extrahieren
    if (route.routeConfig && route.routeConfig.path) {
      // Konvertiere z.B. 'event/:id' zu 'Event'
      const path = route.routeConfig.path.split('/')[0];
      return path.charAt(0).toUpperCase() + path.slice(1).replace(/:.*$/, '');
    }
    
    return 'Radolfzell App';
  }
}
