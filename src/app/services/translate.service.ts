import { ApplicationRef, Injectable, inject, signal } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { Observable } from 'rxjs'
import { toObservable } from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly translateService = inject(TranslateService)
  private readonly appRef = inject(ApplicationRef)

  // Single Source of Truth als Signal
  readonly currentLang = signal<string>('de')

  // Observable-API für Abwärtskompatibilität
  readonly currentLang$ = toObservable(this.currentLang)

  constructor() {
    this.initializeTranslation()
  }

  private initializeTranslation(): void {
    // Verfügbare Sprachen festlegen
    this.translateService.addLangs(['de', 'en', 'fr'])

    // Fallback-Sprache festlegen
    this.translateService.setFallbackLang('de')

    // Browser-Sprache erkennen oder Standardsprache verwenden
    // const browserLang = this.translateService.getBrowserLang()
    // const initialLang = browserLang && ['de', 'en', 'fr'].includes(browserLang) ? browserLang : 'de'
    const initialLang = 'de'

    // Gespeicherte Sprache aus localStorage verwenden, falls vorhanden
    const savedLang = localStorage.getItem('selectedLanguage')

    // Sprache setzen
    this.use(savedLang || initialLang)
  }

  /**
   * Aktuelle Sprache ändern
   */
  use(lang: string): void {
    this.translateService.use(lang)

    // Single Source of Truth aktualisieren
    this.currentLang.set(lang)

    localStorage.setItem('selectedLanguage', lang)

    // Aktualisiere das LOCALE_ID für Angular-interne Formatierungen
    document.documentElement.lang = lang

    // Aktualisiere das LOCALE_ID dynamisch
    this.updateLocaleId(lang)

    // Zoneless CD anstoßen, damit Pipes (z. B. DateTimeRange) ohne Reload neu rendern
    this.appRef.tick()
  }

  /**
   * Aktualisiert das LOCALE_ID dynamisch, um Datums- und Zahlenformatierungen zu aktualisieren
   */
  private updateLocaleId(lang: string): void {
    // Bestimme das Locale basierend auf der Sprache
    let locale = 'de-DE'
    switch (lang) {
      case 'en':
        locale = 'en-GB'
        break
      case 'fr':
        locale = 'fr-FR'
        break
    }

    // Setze das Locale für die Anwendung
    document.documentElement.lang = lang; // 'de' | 'en' | 'fr'
    document.documentElement.setAttribute('data-locale', locale); // 'de-DE' | 'en-GB' | 'fr-FR'
  }

  /**
   * Übersetzung für einen Schlüssel abrufen
   */
  instant(key: string, params?: object): string {
    return this.translateService.instant(key, params)
  }

  /**
   * Übersetzung als Observable abrufen
   */
  get(key: string, params?: object): Observable<string> {
    return this.translateService.get(key, params)
  }

  /**
   * Aktuelle Sprache abrufen
   */
  getCurrentLang(): string {
    return this.translateService.currentLang
  }

  /**
   * Verfügbare Sprachen abrufen
   */
  getLangs(): readonly string[] {
    return this.translateService.getLangs()
  }
}
