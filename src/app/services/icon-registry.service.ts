import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { Observable, of } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
/**
 * SECURITY: SVGs stammen ausschließlich aus den eigenen Assets und wurden manuell geprüft.
 * Es findet KEINE inhaltliche Sanitization (String-Filter/Manipulation) statt.
 * Wir markieren die geprüften SVGs einzig via DomSanitizer.bypassSecurityTrustHtml als vertrauenswürdig,
 * damit Angular sie nicht erneut sanitizet und keine Dev-Warnungen ausgibt.
 * Falls künftig externer/ungeprüfter Inhalt gerendert werden soll, MUSS das Konzept neu bewertet werden.
 */
export class IconRegistryService {
  private readonly urls = new Map<string, string>()
  private readonly cache = new Map<string, Observable<SafeHtml>>()

  private readonly http = inject(HttpClient)
  private readonly sanitizer = inject(DomSanitizer)

  register(name: string, url: string): void {
    this.urls.set(name, url)
  }

  get(name: string): Observable<SafeHtml> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!
    }

    const url = this.urls.get(name)
    if (!url) {
      console.warn(`[IconRegistry] Icon "${name}" ist nicht registriert.`)
      return of(this.sanitizer.bypassSecurityTrustHtml(''))
    }

    const stream = this.http.get(url, { responseType: 'text' }).pipe(
      map((svg) => this.sanitizer.bypassSecurityTrustHtml(this.transformSvg(svg))),
      shareReplay(1),
    )

    this.cache.set(name, stream)
    return stream
  }
private transformSvg(svg: string): string {
    // Grundlegende Sanitization: entferne <script>, Inline-Event-Handler, javascript:-Links, foreignObject
    svg = svg
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    // Remove all inline event handler attributes (on...) repeatedly until none remain
    let prevSvg;
    do {
      prevSvg = svg;
      svg = svg.replace(/\son\w+="[^"]*"/gi, '');
    } while (svg !== prevSvg);
    svg = svg
      .replace(/\s(?:xlink:)?href="javascript:[^"]*"/gi, '')
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')

    // Stelle sicher, dass root <svg> width/height auf 100% gesetzt ist, damit Host-Größe greift
    // und nutze ein vernünftiges preserveAspectRatio.
    if (svg.includes('<svg')) {
      // Füge fehlende Attribute hinzu oder überschreibe existierende width/height/preserveAspectRatio
      svg = svg
        .replace(/<svg([^>]*)>/, (_match, attrs) => {
          let newAttrs = attrs

          // Entferne existierende width/height/preserveAspectRatio, damit wir sie konsistent setzen
          newAttrs = newAttrs.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g, '')

          return `<svg${newAttrs} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`
        })
        // Sorge dafür, dass currentColor durchgreift (falls fill auf root gesetzt ist, lassen wir es)
        .replace(/<path([^>]*)>/g, (match, attrs) => {
          // Wenn weder stroke noch fill gesetzt ist, setze fill="currentColor"
          const hasFill = /\sfill="/.test(attrs)
          const hasStroke = /\sstroke="/.test(attrs)
          if (!hasFill && !hasStroke) {
            return `<path${attrs} fill="currentColor">`
          }
          return match
        })
    }
    return svg
  }
}
