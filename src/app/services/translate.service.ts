import { Injectable, inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { Router, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly translateService = inject(TranslateService)
  private readonly router = inject(Router)
  private readonly currentLangSubject = new BehaviorSubject<string>('de')

  currentLang$ = this.currentLangSubject.asObservable()

  constructor() {
    this.initializeTranslation()
    
    // Überwache Routenänderungen, um die Sprache aus der URL zu erkennen
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.detectLanguageFromUrl()
    })
  }

  private initializeTranslation(): void {
    // Verfügbare Sprachen festlegen
    this.translateService.addLangs(['de', 'en', 'fr'])

    // Fallback-Sprache festlegen (statt setDefaultLang)
    this.translateService.setDefaultLang('de')

    // Browser-Sprache erkennen oder Standardsprache verwenden
    const browserLang = this.translateService.getBrowserLang()
    const initialLang =
      browserLang && ['de', 'en', 'fr'].includes(browserLang)
        ? browserLang
        : 'de'

    // Gespeicherte Sprache aus localStorage verwenden, falls vorhanden
    const savedLang = localStorage.getItem('selectedLanguage')

    // Sprache setzen
    this.setLanguage(savedLang || initialLang, false)
  }

  /**
   * Erkennt die Sprache aus der aktuellen URL
   */
  private detectLanguageFromUrl(): void {
    const url = this.router.url
    const langMatch = url.match(/^\/([a-z]{2})\//)
    
    if (langMatch && ['en', 'fr'].includes(langMatch[1])) {
      // Sprache aus URL-Präfix setzen, ohne Navigation
      this.setLanguage(langMatch[1], false)
    } else if (!url.match(/^\/[a-z]{2}\//)) {
      // Wenn kein Sprachpräfix vorhanden ist, setze Deutsch
      this.setLanguage('de', false)
    }
  }

  /**
   * Aktuelle Sprache ändern
   * @param lang Die neue Sprache
   * @param navigate Ob zur entsprechenden URL navigiert werden soll
   */
  setLanguage(lang: string, navigate = true): void {
    if (!this.translateService.getLangs().includes(lang)) {
      return
    }
    
    this.translateService.use(lang)
    this.currentLangSubject.next(lang)
    localStorage.setItem('selectedLanguage', lang)

    // Aktualisiere das LOCALE_ID für Angular-interne Formatierungen
    document.documentElement.lang = lang

    // Aktualisiere das LOCALE_ID dynamisch
    this.updateLocaleId(lang)
    
    // Navigiere zur entsprechenden URL, wenn gewünscht
    if (navigate) {
      this.navigateToLocalizedRoute(lang)
    }
  }
  
  /**
   * Navigiert zur lokalisierten Route für die angegebene Sprache
   */
  private navigateToLocalizedRoute(lang: string): void {
    const currentUrl = this.router.url
    const urlWithoutLang = currentUrl.replace(/^\/[a-z]{2}\//, '/')
    
    // Für Deutsch keine Sprachpräfix
    if (lang === 'de') {
      this.router.navigateByUrl(urlWithoutLang)
    } else {
      // Für andere Sprachen füge Sprachpräfix hinzu
      this.router.navigateByUrl(`/${lang}${urlWithoutLang}`)
    }
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
}
