import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, Input, signal } from '@angular/core'
import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { TranslateModule } from '@ngx-translate/core'
import { CalendarExportService } from '@app/services/calendar-export.service'

@Component({
  selector: 'app-share',
  imports: [TranslateModule],
  templateUrl: './share.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareComponent {
  @Input() event: Event | null = null
  @Input() location: Location | null = null
  showCopyMessage = false

  showShareOptions = signal(false)

  private readonly calendarService = inject(CalendarExportService)
  private readonly elementRef = inject(ElementRef)

  sharePage() {
    if (!this.event || !this.event.id) {
      console.error('Kein Event oder Event-ID vorhanden')
      return
    }

    const url = this.getEventUrl()

    // Dynamischen Titel und Text basierend auf dem Event-Objekt erstellen
    const title = this.event.name || 'Veranstaltung in Radolfzell'
    const text = `Schau dir diese Veranstaltung in Radolfzell an: ${title}`

    // Wenn Web Share API unterstützt wird, nutze diese
    if (this.canBrowserShareData({ title, text, url })) {
      navigator
        .share({
          title: title,
          text: text,
          url: url,
        })
        .catch((error) => {
          console.error('Fehler beim Teilen:', error)
          // Fallback zur Zwischenablage
          this.copyToClipboard(url)
        })
    } else {
      console.log(
        'Web Share API nicht unterstützt, Fallback zur Zwischenablage',
      )
      // Fallback: In die Zwischenablage kopieren
      this.copyToClipboard(url)
    }
  }

  canBrowserShareData(data: ShareData | undefined): boolean {
    if (!navigator.share || !navigator.canShare) {
      return false
    }
    const canShare = navigator.canShare(data)
    return canShare
  }

  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      // Alternativer Fallback für ältere Browser
      this.fallbackCopyToClipboard(text)
    })
  }

  private fallbackCopyToClipboard(text: string) {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text

      // Element unsichtbar machen und zum DOM hinzufügen
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)

      // Text auswählen und kopieren
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')

      // Element wieder entfernen
      document.body.removeChild(textArea)

      if (successful) {
        this.showCopyMessage = true
        setTimeout(() => {
          this.showCopyMessage = false
        }, 3000) // Nachricht nach 3 Sekunden ausblenden
      }
    } catch (err) {
      console.error('Auch Fallback-Kopieren fehlgeschlagen:', err)
    }
  }

  /**
   * Generiert die Event-URL für die aktuelle Veranstaltung
   */
  private getEventUrl(): string {
    const id = this.event?.id?.id ?? ''
    if (!id) return ''

    const baseUrl = window.location.origin
    return `${baseUrl}/event/${id}`
  }


  /**
   * Zeigt die Kalenderoptionen an oder versteckt sie
   */
  toggleShareOptions(): void {
    this.showShareOptions.update((value) => !value)
  }

  /**
   * Schließt das Dropdown-Menü, wenn außerhalb geklickt wird
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      !this.elementRef.nativeElement.contains(event.target) &&
      this.showShareOptions()
    ) {
      this.showShareOptions.set(false)
    }
  }

  /**
   * Schließt das Dropdown-Menü bei Escape-Taste
   */
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showShareOptions()) {
      this.showShareOptions.set(false)
    }
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
    this.showShareOptions.set(false)
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
    window.open(url, '_blank')
    this.showShareOptions.set(false)
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
    window.open(url, '_blank')
    this.showShareOptions.set(false)
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
    this.showShareOptions.set(false)
  }
}
