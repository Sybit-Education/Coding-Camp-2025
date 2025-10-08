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
   * Erstellt ein CalendarEvent-Objekt aus einem Event und optional einem Location-Objekt
   */
  createCalendarEvent(event: Event, location?: Location | null): CalendarEvent {
    // Standardwerte für Enddatum setzen, falls nicht vorhanden
    const endDate = event.date_end || new Date(event.date_start.getTime() + 60 * 60 * 1000) // +1h als Standard

    // Location-String erstellen
    let locationStr = ''
    if (location) {
      const parts = []
      if (location.name) parts.push(location.name)
      if (location.street) parts.push(location.street)
      if (location.zip_code || location.city) {
        const cityPart = [location.zip_code, location.city].filter(Boolean).join(' ')
        if (cityPart) parts.push(cityPart)
      }
      locationStr = parts.join(', ')
    }

    return {
      title: event.name,
      description: event.description || '',
      location: locationStr,
      startDate: new Date(event.date_start),
      endDate: endDate ? new Date(endDate) : undefined,
      url: event.more_info_link,
    }
  }

  /**
   * Formatiert ein Datum für iCalendar (Format: YYYYMMDDTHHMMSSZ)
   */
  private formatDateForICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '')
  }

  /**
   * Erstellt eine iCalendar-Datei (.ics) für ein Event
   */
  generateICalFile(calEvent: CalendarEvent): string {
    const startDate = this.formatDateForICal(calEvent.startDate)
    const endDate = this.formatDateForICal(calEvent.endDate || calEvent.startDate)
    
    // Beschreibung escapen
    const description = (calEvent.description || '')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
    
    // URL hinzufügen, falls vorhanden
    const urlLine = calEvent.url ? `URL:${calEvent.url}\n` : ''
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//1200 Jahre Radolfzell//Calendar Export//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:${calEvent.title}
DTSTART:${startDate}
DTEND:${endDate}
LOCATION:${calEvent.location}
DESCRIPTION:${description}
${urlLine}END:VEVENT
END:VCALENDAR`
  }

  /**
   * Generiert eine Google Calendar URL
   */
  generateGoogleCalendarUrl(calEvent: CalendarEvent): string {
    const startDate = calEvent.startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '')
    const endDate = (calEvent.endDate || calEvent.startDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '')
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: calEvent.title,
      dates: `${startDate}/${endDate}`,
      details: calEvent.description || '',
      location: calEvent.location || '',
    })
    
    if (calEvent.url) {
      params.append('sprop', `website:${calEvent.url}`)
    }
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  /**
   * Generiert eine Outlook.com Calendar URL
   */
  generateOutlookCalendarUrl(calEvent: CalendarEvent): string {
    const startDate = calEvent.startDate.toISOString().substring(0, 16).replace('T', ' ')
    const endDate = (calEvent.endDate || calEvent.startDate).toISOString().substring(0, 16).replace('T', ' ')
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: calEvent.title,
      startdt: startDate,
      enddt: endDate,
      body: calEvent.description || '',
      location: calEvent.location || '',
    })
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
  }

  /**
   * Erstellt und downloadet eine .ics Datei
   */
  downloadICalFile(calEvent: CalendarEvent, filename = 'event.ics'): void {
    const icalContent = this.generateICalFile(calEvent)
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
