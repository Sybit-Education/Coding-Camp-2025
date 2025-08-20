import { Injectable, inject, signal, computed } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { I18nService } from './translate.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: string;
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  twitterUsername?: string;
  locale?: string;
}

/**
 * Service zur Verwaltung von SEO-relevanten Metadaten und strukturierten Daten
 * Unterstützt Angular 20 Signals für reaktive Updates
 */
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly baseUrl = 'https://1200-jahre-radolfzell.sybit.education';
  private readonly destroy$ = new Subject<void>();
  
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);
  
  // Signals für reaktive Metadaten
  private readonly currentConfig = signal<SeoConfig | null>(null);
  readonly currentConfig$ = toObservable(this.currentConfig);
  
  // Computed Signal für den vollständigen Seitentitel (mit App-Name)
  readonly pageTitle = computed(() => {
    const config = this.currentConfig();
    if (!config) return 'Radolfzell App';
    return `${config.title} | Radolfzell App`;
  });

  constructor() {
    // Automatisch Canonical-URLs aktualisieren bei Routenwechsel
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.currentConfig()) {
        this.updateCanonicalAndHreflang();
      }
    });
  }

  /**
   * Aktualisiert alle SEO-relevanten Meta-Tags für die aktuelle Seite
   */
  updateTags(config: SeoConfig): void {
    // Aktualisiere das Signal
    this.currentConfig.set(config);
    
    // Grundlegende Meta-Tags
    this.title.setTitle(this.pageTitle());
    this.meta.updateTag({ name: 'description', content: config.description });
    
    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }
    
    if (config.author) {
      this.meta.updateTag({ name: 'author', content: config.author });
    }
    
    // Aktuelle URL
    const url = this.getFullUrl();
    
    // Open Graph Tags
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: config.type || 'website' });
    
    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: this.getFullImageUrl(config.image) });
      this.meta.updateTag({ property: 'og:image:alt', content: config.title });
    }
    
    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    
    if (config.image) {
      this.meta.updateTag({ name: 'twitter:image', content: this.getFullImageUrl(config.image) });
    }
    
    if (config.twitterUsername) {
      this.meta.updateTag({ name: 'twitter:site', content: config.twitterUsername });
      this.meta.updateTag({ name: 'twitter:creator', content: config.twitterUsername });
    }
    
    // Zeitstempel für Suchmaschinen
    if (config.publishedAt) {
      this.meta.updateTag({ property: 'article:published_time', content: config.publishedAt });
    }
    
    if (config.modifiedAt) {
      this.meta.updateTag({ property: 'article:modified_time', content: config.modifiedAt });
    }
    
    // Locale für internationale Inhalte
    if (config.locale) {
      this.meta.updateTag({ property: 'og:locale', content: config.locale });
    }
    
    // AI-spezifische Meta-Tags
    this.meta.updateTag({ name: 'ai:description', content: config.description });
    if (config.keywords) {
      this.meta.updateTag({ name: 'ai:keywords', content: config.keywords });
    }
    this.meta.updateTag({ name: 'ai:type', content: config.type || 'website' });
    
    // Canonical URL und hreflang
    this.updateCanonicalAndHreflang();
  }
  
  /**
   * Generiert strukturierte Daten für ein Event im JSON-LD Format
   * Verbessert mit zusätzlichen Feldern für bessere Auffindbarkeit
   */
  generateEventJsonLd(event: any): string {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': event.name,
      'startDate': this.formatDate(event.date_start),
      'endDate': event.date_end ? this.formatDate(event.date_end) : undefined,
      'description': event.description,
      'url': this.getFullUrl(),
      'location': {
        '@type': 'Place',
        'name': event.location?.name || 'Radolfzell am Bodensee',
        'address': event.location?.address || {
          '@type': 'PostalAddress',
          'addressLocality': 'Radolfzell',
          'addressRegion': 'Baden-Württemberg',
          'addressCountry': 'DE'
        },
        'geo': event.location?.coordinates ? {
          '@type': 'GeoCoordinates',
          'latitude': event.location.coordinates[1],
          'longitude': event.location.coordinates[0]
        } : undefined
      },
      'organizer': {
        '@type': 'Organization',
        'name': event.organizer?.name || 'Stadt Radolfzell am Bodensee',
        'url': event.organizer?.website || 'https://www.radolfzell.de',
        'email': event.organizer?.email,
        'telephone': event.organizer?.phonenumber
      },
      'image': event.media?.file ? this.getFullImageUrl(event.media.file) : undefined,
      'offers': event.price ? {
        '@type': 'Offer',
        'price': event.price,
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/InStock',
        'url': this.getFullUrl(),
        'validFrom': this.formatDate(event.date_start)
      } : undefined,
      'eventStatus': 'https://schema.org/EventScheduled',
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
      'performer': event.performer ? {
        '@type': 'PerformingGroup',
        'name': event.performer
      } : undefined,
      'typicalAgeRange': event.age ? `${event.age}+` : undefined,
      'isAccessibleForFree': event.price ? false : true
    };
    
    return JSON.stringify(jsonLd);
  }
  
  /**
   * Generiert strukturierte Daten für eine Organisation im JSON-LD Format
   */
  generateOrganizationJsonLd(organization: any): string {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': organization.name,
      'url': organization.website || this.getFullUrl(),
      'logo': organization.logo ? this.getFullImageUrl(organization.logo) : undefined,
      'email': organization.email,
      'telephone': organization.phonenumber,
      'address': organization.address ? {
        '@type': 'PostalAddress',
        'streetAddress': organization.address.street,
        'addressLocality': organization.address.city || 'Radolfzell',
        'postalCode': organization.address.zip,
        'addressRegion': organization.address.region || 'Baden-Württemberg',
        'addressCountry': organization.address.country || 'DE'
      } : undefined
    };
    
    return JSON.stringify(jsonLd);
  }
  
  /**
   * Aktualisiert die Canonical URL und hreflang Attribute basierend auf der aktuellen Sprache
   */
  private updateCanonicalAndHreflang(): void {
    const url = this.getFullUrl();
    const urlWithoutLang = this.removeLanguageFromUrl(url);
    
    // Canonical URL
    this.updateCanonicalUrl(url);
    
    // hreflang Tags
    this.updateHreflangTags(urlWithoutLang);
  }
  
  /**
   * Aktualisiert die Canonical URL
   */
  private updateCanonicalUrl(url: string): void {
    // Entferne vorhandene canonical Links
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.setAttribute('href', url);
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      document.head.appendChild(link);
    }
  }
  
  /**
   * Aktualisiert die hreflang Tags für alle unterstützten Sprachen
   */
  private updateHreflangTags(baseUrl: string): void {
    const supportedLanguages = ['de', 'en', 'fr'];
    
    // Entferne vorhandene hreflang Links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    
    // Füge neue hreflang Links hinzu
    supportedLanguages.forEach(lang => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      
      const langUrl = lang === 'de' ? baseUrl : `${baseUrl}/${lang}/`;
      link.setAttribute('href', langUrl);
      
      document.head.appendChild(link);
    });
    
    // X-Default hreflang für Suchmaschinen hinzufügen
    const defaultLink = document.createElement('link');
    defaultLink.setAttribute('rel', 'alternate');
    defaultLink.setAttribute('hreflang', 'x-default');
    defaultLink.setAttribute('href', baseUrl);
    document.head.appendChild(defaultLink);
  }
  
  /**
   * Gibt die vollständige URL der aktuellen Seite zurück
   */
  private getFullUrl(): string {
    return `${this.baseUrl}${this.router.url}`;
  }
  
  /**
   * Gibt die vollständige URL für ein Bild zurück
   */
  private getFullImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return `${this.baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
  
  /**
   * Entfernt den Sprachcode aus der URL
   */
  private removeLanguageFromUrl(url: string): string {
    // Entferne Sprachcode wie /en/ aus der URL
    return url.replace(/\/[a-z]{2}\//, '/');
  }
  
  /**
   * Formatiert ein Datum für JSON-LD
   */
  private formatDate(date: Date | string): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  }
}
