import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { CalendarExportService } from '../../services/calendar-export.service'
import { isPlatformBrowser } from '@angular/common'

@Component({
  selector: 'app-calendar-export',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './calendar-export.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarExportComponent {
  @Input() event: Event | null = null
  @Input() location: Location | null = null

  showCalendarOptions = signal(false)

  private readonly calendarService = inject(CalendarExportService)
  private readonly elementRef = inject(ElementRef)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)

  /**
   * Zeigt die Kalenderoptionen an oder versteckt sie
   */
  toggleCalendarOptions(): void {
    this.showCalendarOptions.update((value) => !value)
  }

  /**
   * Schließt das Dropdown-Menü, wenn außerhalb geklickt wird
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isBrowser) {
      return
    }

    if (
      !this.elementRef.nativeElement.contains(event.target) &&
      this.showCalendarOptions()
    ) {
      this.showCalendarOptions.set(false)
    }
  }

  /**
   * Schließt das Dropdown-Menü bei Escape-Taste
   */
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (!this.isBrowser) {
      return
    }
    if (this.showCalendarOptions()) {
      this.showCalendarOptions.set(false)
    }
  }

  /**
   * Generiert die Event-URL für die aktuelle Veranstaltung
   */
  private getEventUrl(): string {
    const id = this.event?.id?.id ?? ''
    if (!id) return ''
    if (!this.isBrowser) {
      return `/event/${id}`
    }

    const baseUrl = window.location.origin
    return `${baseUrl}/event/${id}`
  }

  /**
   * Exportiert das Event als iCal-Datei (.ics)
   */
  exportToICalendar(): void {
    if (!this.event) return

    const eventUrl = this.getEventUrl()
    const calEvent = this.calendarService.createCalendarEvent(
      this.event,
      this.location,
      eventUrl,
    )
    const filename = `${this.event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    this.calendarService.downloadICalFile(calEvent, filename)
    this.showCalendarOptions.set(false)
  }

  /**
   * Öffnet das Event im Google Kalender
   */
  openInGoogleCalendar(): void {
    if (!this.event) return

    const eventUrl = this.getEventUrl()
    const calEvent = this.calendarService.createCalendarEvent(
      this.event,
      this.location,
      eventUrl,
    )
    const url = this.calendarService.generateGoogleCalendarUrl(calEvent)
    if (this.isBrowser) {
      window.open(url, '_blank')
    }
    this.showCalendarOptions.set(false)
  }

  /**
   * Öffnet das Event im Outlook Kalender
   */
  openInOutlookCalendar(): void {
    if (!this.event) return

    const eventUrl = this.getEventUrl()
    const calEvent = this.calendarService.createCalendarEvent(
      this.event,
      this.location,
      eventUrl,
    )
    const url = this.calendarService.generateOutlookCalendarUrl(calEvent)
    if (this.isBrowser) {
      window.open(url, '_blank')
    }
    this.showCalendarOptions.set(false)
  }

  /**
   * Öffnet das Event im Apple Kalender
   *
   * Hinweis: Diese Methode funktioniert am besten auf macOS/iOS Geräten
   */
  openInAppleCalendar(): void {
    if (!this.event) return

    // Für Apple Kalender laden wir die iCal-Datei direkt herunter
    // und öffnen sie mit dem webcal:// Protokoll
    const eventUrl = this.getEventUrl()
    const calEvent = this.calendarService.createCalendarEvent(
      this.event,
      this.location,
      eventUrl,
    )

    // Für Apple Kalender ist es am einfachsten, die iCal-Datei direkt herunterzuladen
    // Das Betriebssystem wird sie dann mit der Kalender-App öffnen
    this.calendarService.downloadICalFile(
      calEvent,
      `${this.event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`,
    )
    this.showCalendarOptions.set(false)
  }
}
