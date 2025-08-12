import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Event } from '../../models/event.interface'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-share',
  imports: [CommonModule, TranslateModule],
  templateUrl: './share.component.html',
  standalone: true,
})
export class ShareComponent {
  @Input() event: Event | null = null

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
    navigator.clipboard
      .writeText(text)
      .then(() => console.log('Link in Zwischenablage kopiert'))
      .catch((err) => console.error('Fehler beim Kopieren:', err))
  }
}
