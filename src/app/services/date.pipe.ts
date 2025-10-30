// date-time-range.pipe.ts
import { Pipe, PipeTransform, inject, OnDestroy } from '@angular/core'
import { formatDate } from '@angular/common'
import { I18nService } from './translate.service'
import { Subscription } from 'rxjs'

@Pipe({
  name: 'dateTimeRange',
  standalone: true,
  pure: false, // Impure pipe, um auf Sprachänderungen zu reagieren
})
export class DateTimeRangePipe implements PipeTransform, OnDestroy {
  private readonly i18nService = inject(I18nService)
  private readonly langChangeSub: Subscription
  // Entferne ungenutzte Variablen

  constructor() {
    // Abonniere Sprachänderungen
    this.langChangeSub = this.i18nService.currentLang$.subscribe(() => {
      // Die Pipe wird automatisch neu ausgewertet, wenn sich die Sprache ändert
    })
  }

  ngOnDestroy(): void {
    if (this.langChangeSub) {
      this.langChangeSub.unsubscribe()
    }
  }

  // Cache für formatierte Datumswerte
  private readonly dateCache = new Map<string, string>()

  transform(
    startIso: string | Date | null,
    endIso?: string | Date | null,
    locale?: string,
  ): string {
    if (!startIso) return ''

    // Erstelle einen Cache-Key
    const cacheKey = `${startIso}-${endIso}-${locale || 'default'}-${this.i18nService.getCurrentLang()}`

    // Prüfe, ob das Ergebnis bereits im Cache ist
    if (this.dateCache.has(cacheKey)) {
      return this.dateCache.get(cacheKey)!
    }

    // Verwende die aktuelle Sprache für die Formatierung, falls keine Locale angegeben wurde
    const currentLang = this.i18nService.getCurrentLang()
    const effectiveLocale = locale || this.getLocaleFromLang(currentLang)

    const start = startIso instanceof Date ? startIso : new Date(startIso)
    let result: string

    if (!endIso) {
      result = this.formatSingleDateTime(start, effectiveLocale)
    } else {
      const end = endIso instanceof Date ? endIso : new Date(endIso)
      const sameDay = start.toDateString() === end.toDateString()

      if (sameDay) {
        result = this.formatSameDayRange(start, end, effectiveLocale)
      } else {
        result = this.formatMultiDayRange(start, end, effectiveLocale)
      }
    }

    // Speichere das Ergebnis im Cache
    this.dateCache.set(cacheKey, result)

    // Begrenze die Cache-Größe
    if (this.dateCache.size > 100) {
      const firstKey = this.dateCache.keys().next().value
      if (firstKey !== undefined) {
        this.dateCache.delete(firstKey)
      }
    }

    return result
  }

  private getLocaleFromLang(lang: string): string {
    switch (lang) {
      case 'en':
        return 'en-GB'
      case 'fr':
        return 'fr-FR'
      default:
        return 'de-DE'
    }
  }

  private formatSingleDateTime(date: Date, locale: string): string {
    const currentLang = this.i18nService.getCurrentLang()

    // Sprachspezifische Formatierung
    switch (currentLang) {
      case 'en':
        return formatDate(date, 'MMMM d, y – h:mm a', locale)
      case 'fr':
        return formatDate(date, "d MMMM y – HH'h'mm", locale)
      default: // Deutsch
        return formatDate(date, "d. MMMM y – HH:mm 'Uhr'", locale)
    }
  }

  private formatSameDayRange(start: Date, end: Date, locale: string): string {
    const currentLang = this.i18nService.getCurrentLang()

    // Sprachspezifische Formatierung für Zeitbereiche am selben Tag
    switch (currentLang) {
      case 'en': {
        const sEn = formatDate(start, 'MMMM d, y – h:mm', locale)
        const eEn = formatDate(end, 'h:mm a', locale)
        return `${sEn} to ${eEn}`
      }
      case 'fr': {
        const sFr = formatDate(start, "d MMMM y – HH'h'mm", locale)
        const eFr = formatDate(end, "HH'h'mm", locale)
        return `${sFr} à ${eFr}`
      }
      default: {
        // Deutsch
        const sDe = formatDate(start, 'd. MMMM y – HH:mm', locale)
        const eDe = formatDate(end, 'HH:mm', locale)
        return `${sDe} bis ${eDe} Uhr`
      }
    }
  }

  private formatMultiDayRange(start: Date, end: Date, locale: string): string {
    const currentLang = this.i18nService.getCurrentLang()

    // Sprachspezifische Formatierung für mehrtägige Zeitbereiche
    switch (currentLang) {
      case 'en': {
        const sEn = formatDate(start, 'MMMM d, y – h:mm a', locale)
        const eEn = formatDate(end, 'MMMM d, y – h:mm a', locale)
        return `${sEn} to ${eEn}`
      }
      case 'fr': {
        const sFr = formatDate(start, "d MMMM y – HH'h'mm", locale)
        const eFr = formatDate(end, "d MMMM y – HH'h'mm", locale)
        return `${sFr} au ${eFr}`
      }
      default: {
        // Deutsch
        const sDe = formatDate(start, "d. MMMM y – HH:mm 'Uhr'", locale)
        const eDe = formatDate(end, "d. MMMM y – HH:mm 'Uhr'", locale)
        return `${sDe} bis ${eDe}`
      }
    }
  }
}
