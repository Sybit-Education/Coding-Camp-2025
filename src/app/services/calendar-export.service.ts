import { Injectable } from '@angular/core'
import { Event } from '../models/event.interface'
import { Location } from '../models/location.interface'

export interface CalendarEvent {
  title: string
  description: string
  location: string
  startDate: Date
  endDate?: Date
  url?: string
}

@Injectable({
  providedIn: 'root',
})
export class CalendarExportService {
  /**
   * Entfernt HTML-Tags aus einem String
   */
  private stripHtml(html: string): string {
    // Temporäres div-Element erstellen
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    // Text ohne HTML-Tags zurückgeben
    return tempDiv.textContent || tempDiv.innerText || ''
  }

  /**
   * Erstellt ein CalendarEvent-Objekt aus einem Event und optional einem Location-Objekt
   */
  createCalendarEvent(
    event: Event,
    location?: Location | null,
    eventUrl?: string,
  ): CalendarEvent {
    // Standardwerte für Enddatum setzen, falls nicht vorhanden
    const endDate =
      event.date_end || new Date(event.date_start.getTime() + 60 * 60 * 1000) // +1h als Standard

    // Location-String erstellen
    let locationStr = ''
    if (location) {
      const parts = []
      if (location.name) parts.push(location.name)
      if (location.street) parts.push(location.street)
      if (location.zip_code || location.city) {
        const cityPart = [location.zip_code, location.city]
          .filter(Boolean)
          .join(' ')
        if (cityPart) parts.push(cityPart)
      }
      locationStr = parts.join(', ')
    }

    // HTML aus der Beschreibung entfernen und mit Link zur Veranstaltung anreichern
    let description = event.description ? this.stripHtml(event.description) : ''
    // Entferne überschüssige Leerzeichen und ersetze mehrere Leerzeichen durch ein einzelnes
    description = description.replace(/\s+/g, ' ').trim()

    if (eventUrl) {
      description += description ? '\n\n' : ''
      description += `Mehr Informationen: ${eventUrl}`
    }

    return {
      title: event.name,
      description: description,
      location: locationStr,
      startDate: new Date(event.date_start),
      endDate: endDate ? new Date(endDate) : undefined,
      url: eventUrl || event.more_info_link,
    }
  }

  /**
   * Formatiert ein Datum für iCalendar (Format: YYYYMMDDTHHMMSSZ)
   */
  private formatDateForICal(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/g, '')
  }

  /**
   * Sicheres Escapen von Zeichen für iCalendar-Format
   */
  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\') // Backslash muss zuerst ersetzt werden
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/</g, '') // Entferne verbliebene < Zeichen
      .replace(/>/g, '') // Entferne verbliebene > Zeichen
  }

  /**
   * Erstellt eine iCalendar-Datei (.ics) für ein Event
   */
  generateICalFile(calEvent: CalendarEvent): string {
    const startDate = this.formatDateForICal(calEvent.startDate)
    const endDate = this.formatDateForICal(
      calEvent.endDate || calEvent.startDate,
    )

    // Beschreibung sicher escapen
    const description = this.escapeICalText(calEvent.description || '')

    // Titel und Ort sicher escapen
    const summary = this.escapeICalText(calEvent.title)
    const location = this.escapeICalText(calEvent.location)

    // URL hinzufügen, falls vorhanden
    const urlLine = calEvent.url
      ? `URL:${this.escapeICalText(calEvent.url)}\n`
      : ''

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//1200 Jahre Radolfzell//Calendar Export//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:${summary}
DTSTART:${startDate}
DTEND:${endDate}
LOCATION:${location}
DESCRIPTION:${description}
${urlLine}END:VEVENT
END:VCALENDAR`
  }

  /**
   * Generiert eine Google Calendar URL
   */
  generateGoogleCalendarUrl(calEvent: CalendarEvent): string {
    const startDate = calEvent.startDate
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/g, '')
    const endDate = (calEvent.endDate || calEvent.startDate)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/g, '')

    // Stelle sicher, dass die Beschreibung keine HTML-Tags enthält
    const cleanDescription = this.stripHtml(calEvent.description || '')

    // URLSearchParams übernimmt automatisch das korrekte URL-Encoding
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: calEvent.title,
      dates: `${startDate}/${endDate}`,
      details: cleanDescription,
      location: calEvent.location || '',
    })

    if (calEvent.url) {
      params.append('sprop', `website:${calEvent.url}`)
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  /**
   * Generiert eine Outlook.com Calendar URL
   *
   * Basierend auf der aktuellen Outlook.com Web-Schnittstelle
   */
  generateOutlookCalendarUrl(calEvent: CalendarEvent): string {
    // Formatiere Datum im ISO-Format für Outlook
    const startISO = calEvent.startDate.toISOString()
    const endISO = (
      calEvent.endDate ||
      new Date(calEvent.startDate.getTime() + 60 * 60 * 1000)
    ).toISOString()

    // Stelle sicher, dass die Beschreibung keine HTML-Tags enthält
    const cleanDescription = this.stripHtml(calEvent.description || '')

    // URLSearchParams übernimmt automatisch das korrekte URL-Encoding
    const params = new URLSearchParams({
      subject: calEvent.title,
      startdt: startISO,
      enddt: endISO,
      body: cleanDescription,
      location: calEvent.location || '',
    })

    if (calEvent.url) {
      params.append('body', `${cleanDescription}\n\n${calEvent.url}`)
    }

    return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`
  }

  /**
   * Generiert eine Apple Calendar URL (webcal://)
   *
   * Hinweis: Diese Methode erstellt einen temporären Download und öffnet dann
   * das webcal-Protokoll, das von Apple Kalendern unterstützt wird.
   */
  generateAppleCalendarUrl(calEvent: CalendarEvent): string {
    // Für Apple Kalender verwenden wir das webcal:// Protokoll
    // Dies funktioniert auf macOS und iOS Geräten

    // Erstelle die iCal-Datei
    const icalContent = this.generateICalFile(calEvent)

    // Erstelle einen Blob und einen temporären URL
    const blob = new Blob([icalContent], {
      type: 'text/calendar;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)

    // Wandle den http(s):// URL in einen webcal:// URL um
    // Dies wird von Apple Kalendern erkannt und geöffnet
    return url.replace(/^https?:\/\//i, 'webcal://')
  }

  /**
   * Erstellt und downloadet eine .ics Datei
   */
  downloadICalFile(calEvent: CalendarEvent, filename = 'event.ics'): void {
    const icalContent = this.generateICalFile(calEvent)
    const blob = new Blob([icalContent], {
      type: 'text/calendar;charset=utf-8',
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
