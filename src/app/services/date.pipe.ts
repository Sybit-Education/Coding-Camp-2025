// date-time-range.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { I18nService } from './translate.service';

@Pipe({
  name: 'dateTimeRange',
  standalone: true,
  pure: true,
})
export class DateTimeRangePipe implements PipeTransform {
  private i18nService = inject(I18nService);

  transform(
    startIso: string | Date | null,
    endIso?: string | Date | null,
    locale?: string
  ): string {
    if (!startIso) return '';

    // Verwende die aktuelle Sprache für die Formatierung, falls keine Locale angegeben wurde
    const currentLang = this.i18nService.getCurrentLang();
    const effectiveLocale = locale || this.getLocaleFromLang(currentLang);
    
    const start = startIso instanceof Date ? startIso : new Date(startIso);
    if (!endIso) {
      return this.formatSingleDateTime(start, effectiveLocale);
    }

    const end = endIso instanceof Date ? endIso : new Date(endIso);
    const sameDay = start.toDateString() === end.toDateString();

    if (sameDay) {
      return this.formatSameDayRange(start, end, effectiveLocale);
    } else {
      return this.formatMultiDayRange(start, end, effectiveLocale);
    }
  }

  private getLocaleFromLang(lang: string): string {
    switch (lang) {
      case 'en': return 'en-GB';
      case 'fr': return 'fr-FR';
      default: return 'de-DE';
    }
  }

  private formatSingleDateTime(date: Date, locale: string): string {
    const currentLang = this.i18nService.getCurrentLang();
    
    // Sprachspezifische Formatierung
    switch (currentLang) {
      case 'en':
        return formatDate(date, "MMMM d, y – h:mm a", locale);
      case 'fr':
        return formatDate(date, "d MMMM y – HH'h'mm", locale);
      default: // Deutsch
        return formatDate(date, "d. MMMM y – HH:mm 'Uhr'", locale);
    }
  }

  private formatSameDayRange(start: Date, end: Date, locale: string): string {
    const currentLang = this.i18nService.getCurrentLang();
    
    // Sprachspezifische Formatierung für Zeitbereiche am selben Tag
    switch (currentLang) {
      case 'en':
        const sEn = formatDate(start, "MMMM d, y – h:mm", locale);
        const eEn = formatDate(end, "h:mm a", locale);
        return `${sEn} to ${eEn}`;
      case 'fr':
        const sFr = formatDate(start, "d MMMM y – HH'h'mm", locale);
        const eFr = formatDate(end, "HH'h'mm", locale);
        return `${sFr} à ${eFr}`;
      default: // Deutsch
        const sDe = formatDate(start, "d. MMMM y – HH:mm", locale);
        const eDe = formatDate(end, "HH:mm", locale);
        return `${sDe} bis ${eDe} Uhr`;
    }
  }

  private formatMultiDayRange(start: Date, end: Date, locale: string): string {
    const currentLang = this.i18nService.getCurrentLang();
    
    // Sprachspezifische Formatierung für mehrtägige Zeitbereiche
    switch (currentLang) {
      case 'en':
        const sEn = formatDate(start, "MMMM d, y – h:mm a", locale);
        const eEn = formatDate(end, "MMMM d, y – h:mm a", locale);
        return `${sEn} to ${eEn}`;
      case 'fr':
        const sFr = formatDate(start, "d MMMM y – HH'h'mm", locale);
        const eFr = formatDate(end, "d MMMM y – HH'h'mm", locale);
        return `${sFr} au ${eFr}`;
      default: // Deutsch
        const sDe = formatDate(start, "d. MMMM y – HH:mm 'Uhr'", locale);
        const eDe = formatDate(end, "d. MMMM y – HH:mm 'Uhr'", locale);
        return `${sDe} bis ${eDe}`;
    }
  }
}
