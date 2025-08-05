import { Injectable, inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, Observable } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private translateService = inject(TranslateService)
  private currentLangSubject = new BehaviorSubject<string>('de')
  
  currentLang$ = this.currentLangSubject.asObservable()

  constructor() {
    // Verfügbare Sprachen festlegen
    this.translateService.addLangs(['de', 'en'])
    
    // Standardsprache festlegen
    this.translateService.setDefaultLang('de')
    
    // Browser-Sprache erkennen oder Standardsprache verwenden
    const browserLang = this.translateService.getBrowserLang()
    const initialLang = browserLang && ['de', 'en'].includes(browserLang) ? browserLang : 'de'
    
    this.use(initialLang)
    
    // Speichern der ausgewählten Sprache im localStorage
    const savedLang = localStorage.getItem('selectedLanguage')
    if (savedLang) {
      this.use(savedLang)
    }
  }

  /**
   * Aktuelle Sprache ändern
   */
  use(lang: string): void {
    this.translateService.use(lang)
    this.currentLangSubject.next(lang)
    localStorage.setItem('selectedLanguage', lang)
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
  getLangs(): string[] {
    return this.translateService.getLangs()
  }
}
