import { ChangeDetectionStrategy, Component, ElementRef, HostListener, input, inject, signal } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { CalendarExportService } from '../../services/calendar-export.service'
import { IconComponent } from '@app/component/icon/icon.component'

@Component({
  selector: 'app-calendar-export',
  imports: [TranslateModule, IconComponent],
  templateUrl: './calendar-export.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarExportComponent {
  // Signal-based Inputs
  readonly event = input<Event | null>(null)
  readonly location = input<Location | null>(null)

  // Local state
  protected readonly showCalendarOptions = signal(false)

  // Services
  private readonly calendarService = inject(CalendarExportService)
  private readonly elementRef = inject(ElementRef)

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
    if (!this.elementRef.nativeElement.contains(event.target) && this.showCalendarOptions()) {
      this.showCalendarOptions.set(false)
    }
  }

  /**
   * Schließt das Dropdown-Menü bei Escape-Taste
   */
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showCalendarOptions()) {
      this.showCalendarOptions.set(false)
    }
  }

  /**
   * Generiert die Event-URL für die aktuelle Veranstaltung
   */
  private getEventUrl(): string {
    const ev = this.event()
    const id = ev?.id?.id ?? ''
    if (!id) return ''

    const baseUrl = window.location.origin
    return `${baseUrl}/event/${id}`
  }

  /**
   * Exportiert das Event als iCal-Datei (.ics)
   */
  exportToICalendar(): void {
    const ev = this.event()
    if (!ev) return

    const eventUrl = this.getEventUrl()
    const calEvent = this.calendarService.createCalendarEvent(ev, this.location(), eventUrl)
    const filename = `${ev.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    this.calendarService.downloadICalFile(calEvent, filename)
    this.showCalendarOptions.set(false)
  }

  /**
   * Öffnet das Event im Google Kalender
   */
  openInGoogleCalendar(): void {
    const ev = this.event()
    if (!ev) return

    const eventUrl = this.getEventUrl()
    const calEvent = this.calendarService.createCalendarEvent(ev, this.location(), eventUrl)
    const url = this.calendarService.generateGoogleCalendarUrl(calEvent)
    window.open(url, '_blank')
    this.showCalendarOptions.set(false)
  }

  /**
   * Öffnet das Event im Outlook Kalender
   */
  openInOutlookCalendar(): void {
    const ev = this.event()
    if (!ev) return

    const eventUrl = this.getEventUrl()
    const calEvent = this.calendarService.createCalendarEvent(ev, this.location(), eventUrl)
    const url = this.calendarService.generateOutlookCalendarUrl(calEvent)
    window.open(url, '_blank')
    this.showCalendarOptions.set(false)
  }

  /**
   * Öffnet das Event im Apple Kalender
   *
   * Hinweis: Diese Methode funktioniert am besten auf macOS/iOS Geräten
   */
  openInAppleCalendar(): void {
    const ev = this.event()
    if (!ev) return

    // Für Apple Kalender laden wir die iCal-Datei direkt herunter
    // und öffnen sie mit dem webcal:// Protokoll
    const eventUrl = this.getEventUrl()
    const calEvent = this.calendarService.createCalendarEvent(ev, this.location(), eventUrl)

    // Für Apple Kalender ist es am einfachsten, die iCal-Datei direkt herunterzuladen
    // Das Betriebssystem wird sie dann mit der Kalender-App öffnen
    this.calendarService.downloadICalFile(calEvent, `${ev.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`)
    this.showCalendarOptions.set(false)
  }
}
