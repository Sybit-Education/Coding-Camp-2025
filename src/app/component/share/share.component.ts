import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../models/event.interface';

@Component({
  selector: 'app-share',
  imports: [CommonModule],
  templateUrl: './share.component.html',
  standalone: true,
})
export class ShareComponent implements OnInit {
  @Input() event: Event | null = null;
  isWebShareSupported = false;
  
  ngOnInit() {
    // Prüfen, ob die Web Share API unterstützt wird
    this.isWebShareSupported = !!navigator.share;
  }

  sharePage() {
    if (!this.event || !this.event.id) {
      console.error('Kein Event oder Event-ID vorhanden');
      return;
    }
    
    const id = this.event.id.id || '';
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/event/${id}`;
    
    // Dynamischen Titel und Text basierend auf dem Event-Objekt erstellen
    const title = this.event.name || 'Veranstaltung in Radolfzell';
    const text = `Schau dir diese Veranstaltung in Radolfzell an: ${title}`;
    
    // Wenn Web Share API unterstützt wird, nutze diese
    if (this.isWebShareSupported) {
      navigator.share({
        title: title,
        text: text,
        url: url
      })
      .then(() => console.log('Erfolgreich geteilt'))
      .catch((error) => {
        console.error('Fehler beim Teilen:', error);
        // Fallback zur Zwischenablage
        this.copyToClipboard(url);
      });
    } else {
      // Fallback: In die Zwischenablage kopieren
      this.copyToClipboard(url);
    }
  }
  
  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
      .then(() => console.log('Link in Zwischenablage kopiert'))
      .catch(err => console.error('Fehler beim Kopieren:', err));
  }
}
