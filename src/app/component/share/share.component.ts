import { ChangeDetectionStrategy, Component, Input, PLATFORM_ID, inject } from '@angular/core'
import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { TranslateModule } from '@ngx-translate/core'
import { isPlatformBrowser } from '@angular/common'

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

  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)

  sharePage() {
    if (!this.isBrowser) {
      console.warn('Sharing ist außerhalb des Browsers nicht verfügbar.')
      return
    }

    if (!this.event?.id) {
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
    if (!this.isBrowser) {
      return false
    }
    if (!navigator.share || !navigator.canShare) {
      return false
    }
    const canShare = navigator.canShare(data)
    return canShare
  }

  private copyToClipboard(text: string) {
    if (!this.isBrowser) {
      return
    }
    navigator.clipboard.writeText(text).catch(() => {
      // Alternativer Fallback für ältere Browser
      this.fallbackCopyToClipboard(text)
    })
  }

  private fallbackCopyToClipboard(text: string) {
    if (!this.isBrowser) {
      return
    }
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

    if (!this.isBrowser) {
      return `/event/${id}`
    }

    const baseUrl = window.location.origin
    return `${baseUrl}/event/${id}`
  }
}
