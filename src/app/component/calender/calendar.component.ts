import { Component, Input } from '@angular/core'

@Component({
  selector: 'app-calendar',
  imports: [],
  templateUrl: './calendar.component.html',
})
export class CalenderComponent {
  @Input() title!: string
  @Input() description = ''
  @Input() location = ''
  @Input() startDateTime!: string // ISO 8601 z.B. '2025-08-10T15:00:00'
  @Input() endDateTime!: string

  menuOpen = false

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen
  }

  closeMenu(): void {
    this.menuOpen = false
  }

  getGoogleCalendarUrl(): string {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: this.title,
      dates: `${this.formatDate(this.startDateTime)}/${this.formatDate(this.endDateTime)}`,
      details: this.description,
      location: this.location,
    })
    return `https://www.google.com/calendar/render?${params.toString()}`
  }

  getOutlookCalendarUrl(): string {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      startdt: this.startDateTime,
      enddt: this.endDateTime,
      subject: this.title,
      body: this.description,
      location: this.location,
    })
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
  }

  downloadICS(): void {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${this.formatDate(this.startDateTime)}`,
      `DTEND:${this.formatDate(this.endDateTime)}`,
      `SUMMARY:${this.title}`,
      `DESCRIPTION:${this.description}`,
      `LOCATION:${this.location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${this.title}.ics`
    a.click()

    window.URL.revokeObjectURL(url)
  }

  private formatDate(date: string): string {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
}
