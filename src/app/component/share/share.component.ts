import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-share',
  imports: [CommonModule],
  templateUrl: './share.component.html',
  standalone: true,
})
export class ShareComponent implements OnInit {
  @Input() eventId = "";
  isWebShareSupported = false;
  
  ngOnInit() {
    // Prüfen, ob die Web Share API unterstützt wird
    this.isWebShareSupported = !!navigator.share;
  }

  sharePage() {
    const url = 'https://1200-jahre-radolfzell.sybit.education/event/' + this.eventId;
    const title = 'Veranstaltung in Radolfzell';
    const text = 'Schau dir diese Veranstaltung in Radolfzell an!';
    
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
