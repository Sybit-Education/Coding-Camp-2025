import { Injectable, inject, signal } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { toSignal } from '@angular/core/rxjs-interop'

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly translateService = inject(TranslateService)

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
    const browserLang = this.translateService.getBrowserLang()
    const initialLang = browserLang && ['de', 'en', 'fr'].includes(browserLang) ? browserLang : 'de'

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

    // Beide State-Mechanismen aktualisieren
    this.currentLangState.set(lang)
    this.currentLangSubject.next(lang)

    localStorage.setItem('selectedLanguage', lang)

    // Aktualisiere das LOCALE_ID für Angular-interne Formatierungen
    document.documentElement.lang = lang

    // Aktualisiere das LOCALE_ID dynamisch
    this.updateLocaleId(lang)
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
