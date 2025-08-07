// date-time-range.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';

@Pipe({
  name: 'dateTimeRange',
  standalone: true,
  pure: true,
})
export class DateTimeRangePipe implements PipeTransform {
  transform(
    startIso: string | Date | null,
    endIso?: string | Date | null,
    locale = 'de-DE'
  ): string {
    if (!startIso) return '';

    const start = startIso instanceof Date ? startIso : new Date(startIso);
    if (!endIso) {
      return formatDate(start, "d. MMMM y – HH:mm 'Uhr'", locale);
    }

    const end = endIso instanceof Date ? endIso : new Date(endIso);

    const sameDay = start.toDateString() === end.toDateString();

    if (sameDay) {
      // 1 Tag: "21. Mai 2026 – 19:00 bis 21:00 Uhr"
      const s = formatDate(start, "d. MMMM y – HH:mm", locale);
      const e = formatDate(end, "HH:mm", locale);
      return `${s} bis ${e} Uhr`;
    } else {
      // Mehrere Tage: "21. Mai 2026 – 19:00 Uhr bis 22. Mai 2026 – 03:00 Uhr"
      const s = formatDate(start, "d. MMMM y – HH:mm 'Uhr'", locale);
      const e = formatDate(end,   "d. MMMM y – HH:mm 'Uhr'", locale);
      return `${s} bis ${e}`;
    }
  }
}
