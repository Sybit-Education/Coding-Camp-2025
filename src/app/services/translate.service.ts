import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { toSignal } from '@angular/core/rxjs-interop'
import { isPlatformBrowser } from '@angular/common'

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly translateService = inject(TranslateService)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)

  // Signal für reaktiven State
  readonly currentLangState = signal<string>('de')

  // BehaviorSubject für Abwärtskompatibilität
  private readonly currentLangSubject = new BehaviorSubject<string>('de')
  currentLang$ = this.currentLangSubject.asObservable()

  // Signal aus Observable für Komponenten
  readonly currentLang = toSignal(this.currentLang$, { initialValue: 'de' })

  constructor() {
    this.initializeTranslation()
  }

  private initializeTranslation(): void {
    // Verfügbare Sprachen festlegen
    this.translateService.addLangs(['de', 'en', 'fr'])

    // Fallback-Sprache festlegen
    this.translateService.setFallbackLang('de')

    // Browser-Sprache erkennen oder Standardsprache verwenden
    const browserLang = this.isBrowser
      ? this.translateService.getBrowserLang()
      : undefined
    const initialLang =
      browserLang && ['de', 'en', 'fr'].includes(browserLang)
        ? browserLang
        : 'de'

    // Gespeicherte Sprache aus localStorage verwenden, falls vorhanden
    const savedLang = this.getStoredLanguage()

    // Sprache setzen
    this.use(savedLang || initialLang)
  }

  /**
   * Aktuelle Sprache ändern
   */
  use(lang: string): void {
    this.translateService.use(lang)

    // Beide State-Mechanismen aktualisieren
    this.currentLangState.set(lang)
    this.currentLangSubject.next(lang)

    this.persistLanguage(lang)

    // Aktualisiere das LOCALE_ID für Angular-interne Formatierungen
    this.updateDocumentLang(lang)

    // Aktualisiere das LOCALE_ID dynamisch
    this.updateLocaleId(lang)
  }

  /**
   * Aktualisiert das LOCALE_ID dynamisch, um Datums- und Zahlenformatierungen zu aktualisieren
   */
  private updateLocaleId(lang: string): void {
    if (!this.isBrowser) {
      return
    }

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
    document.documentElement.setAttribute('lang', locale)
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

  private getStoredLanguage(): string | null {
    if (!this.isBrowser) {
      return null
    }

    try {
      return window.localStorage.getItem('selectedLanguage')
    } catch (error) {
      console.warn('Konnte gespeicherte Sprache nicht lesen:', error)
      return null
    }
  }

  private persistLanguage(lang: string): void {
    if (!this.isBrowser) {
      return
    }

    try {
      window.localStorage.setItem('selectedLanguage', lang)
    } catch (error) {
      console.warn('Konnte Sprache nicht speichern:', error)
    }
  }

  private updateDocumentLang(lang: string): void {
    if (!this.isBrowser) {
      return
    }

    document.documentElement.lang = lang
  }
}
