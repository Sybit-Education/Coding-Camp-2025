import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { I18nService } from './translate.service';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: string;
  author?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly baseUrl = 'https://1200-jahre-radolfzell.sybit.education';

  constructor(
    private readonly meta: Meta,
    private readonly title: Title,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  /**
   * Aktualisiert alle SEO-relevanten Meta-Tags für die aktuelle Seite
   */
  updateTags(config: SeoConfig): void {
    // Grundlegende Meta-Tags
    this.title.setTitle(config.title);
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
    }
    
    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    
    if (config.image) {
      this.meta.updateTag({ name: 'twitter:image', content: this.getFullImageUrl(config.image) });
    }
    
    // AI-spezifische Meta-Tags
    this.meta.updateTag({ name: 'ai:description', content: config.description });
    if (config.keywords) {
      this.meta.updateTag({ name: 'ai:keywords', content: config.keywords });
    }
    
    // Canonical URL und hreflang
    this.updateCanonicalAndHreflang();
  }
  
  /**
   * Generiert strukturierte Daten für ein Event im JSON-LD Format
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
        }
      },
      'organizer': {
        '@type': 'Organization',
        'name': event.organizer?.name || 'Stadt Radolfzell am Bodensee',
        'url': 'https://www.radolfzell.de'
      },
      'image': event.media?.file ? this.getFullImageUrl(event.media.file) : undefined,
      'offers': event.price ? {
        '@type': 'Offer',
        'price': event.price,
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/InStock',
        'url': this.getFullUrl()
      } : undefined
    };
    
    return JSON.stringify(jsonLd);
  }
  
  /**
   * Aktualisiert die Canonical URL und hreflang Attribute basierend auf der aktuellen Sprache
   */
  private updateCanonicalAndHreflang(): void {
    const currentLang = this.i18nService.currentLang$;
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
