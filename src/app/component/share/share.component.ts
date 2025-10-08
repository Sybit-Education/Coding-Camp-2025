import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core'

import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { TranslateModule } from '@ngx-translate/core'
import { CalendarExportService } from '../../services/calendar-export.service'

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
  showCalendarOptions = signal(false)
  
  private readonly calendarService = inject(CalendarExportService)

  sharePage() {
    if (!this.event || !this.event.id) {
      console.error('Kein Event oder Event-ID vorhanden')
      return
    }

    const id = this.event.id.id || ''
    const baseUrl = window.location.origin
    const url = `${baseUrl}/event/${id}`

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
        .then(() => console.log('Erfolgreich geteilt'))
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
    console.log('Kann geteilt werden:', canShare)
    return canShare
  }

  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Fehler beim Kopieren:', err)
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
        console.log('Link in Zwischenablage kopiert (Fallback)')
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
   * Zeigt die Kalenderoptionen an oder versteckt sie
   */
  toggleCalendarOptions(): void {
    this.showCalendarOptions.update(value => !value)
  }

  /**
   * Exportiert das Event als iCal-Datei (.ics)
   */
  exportToICalendar(): void {
    if (!this.event) return
    
    const calEvent = this.calendarService.createCalendarEvent(this.event, this.location)
    const filename = `${this.event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    this.calendarService.downloadICalFile(calEvent, filename)
    this.showCalendarOptions.set(false)
  }

  /**
   * Öffnet das Event im Google Kalender
   */
  openInGoogleCalendar(): void {
    if (!this.event) return
    
    const calEvent = this.calendarService.createCalendarEvent(this.event, this.location)
    const url = this.calendarService.generateGoogleCalendarUrl(calEvent)
    window.open(url, '_blank')
    this.showCalendarOptions.set(false)
  }

  /**
   * Öffnet das Event im Outlook Kalender
   */
  openInOutlookCalendar(): void {
    if (!this.event) return
    
    const calEvent = this.calendarService.createCalendarEvent(this.event, this.location)
    const url = this.calendarService.generateOutlookCalendarUrl(calEvent)
    window.open(url, '_blank')
    this.showCalendarOptions.set(false)
  }
}
