import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-add-to-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="add-to-cal">
      <button class="atc-btn" (click)="toggle()">{{ buttonText }}</button>
      <div class="atc-dropdown z-50" *ngIf="open">
        <a [href]="googleLink" target="_blank" rel="noopener"
          >Google Calendar</a
        >
        <a [href]="icsHref" [attr.download]="filename">Apple/Outlook</a>
      </div>
    </div>
  `,
  styles: [
    `
      .add-to-cal {
        position: relative;
        display: inline-block;
      }
      .atc-btn {
        background: #007bff;
        color: #fff;
        padding: 10px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .atc-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        margin-top: 4px;
        z-index: 100;
      }
      .atc-dropdown a {
        display: block;
        padding: 8px 12px;
        font-size: 14px;
        color: #333;
        text-decoration: none;
      }
      .atc-dropdown a:hover {
        background: #f5f5f5;
      }
    `,
  ],
})
export class AddToCalendarComponent implements OnInit, OnChanges {
  @Input() title = ''
  @Input() start!: string // ISO: '2025-08-15T09:00:00'
  @Input() end!: string
  @Input() location = ''
  @Input() description = ''

  @Input() buttonText = 'In Kalender eintragen'
  filename = 'event.ics'

  open = false
  googleLink = ''
  icsHref = ''

  ngOnInit() {
    this.updateLinks()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['title'] ||
      changes['start'] ||
      changes['end'] ||
      changes['location'] ||
      changes['description']
    ) {
      this.updateLinks()
    }
  }

  toggle() {
    this.open = !this.open
  }

  private updateLinks(): void {
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    const toICal = (iso: string) => {
      const d = new Date(iso)
      return (
        d.getUTCFullYear().toString() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) +
        'Z'
      )
    }

    // Google Calendar
    const dates = `${toICal(this.start)}/${toICal(this.end)}`
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: this.title,
      dates,
      location: this.location,
      details: this.description,
    })
    this.googleLink = `https://calendar.google.com/calendar/render?${params.toString()}`

    // ICS for Apple/Outlook
    const now = new Date().toISOString()
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YourCompany//AddToCalendar//DE',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@yourdomain.com`,
      `DTSTAMP:${toICal(now)}`,
      `DTSTART:${toICal(this.start)}`,
      `DTEND:${toICal(this.end)}`,
      `SUMMARY:${this.title}`,
      `DESCRIPTION:${this.description}`,
      `LOCATION:${this.location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ]
    const icsString = icsLines.join('\r\n')
    const base64 = btoa(unescape(encodeURIComponent(icsString)))
    this.icsHref = `data:text/calendar;charset=utf-8;base64,${base64}`
  }
}
