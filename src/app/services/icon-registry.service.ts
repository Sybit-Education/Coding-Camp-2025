import { inject, Injectable } from '@angular/core'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
export class IconRegistryService {
  private readonly urls = new Map<string, string>()
  private readonly cache = new Map<string, Observable<SafeHtml>>()

  private readonly sanitizer = inject(DomSanitizer)
  private readonly http = inject(HttpClient)

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
      map((svg) => this.transformSvg(svg)),
      map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg)),
      shareReplay(1),
    )

    this.cache.set(name, stream)
    return stream
  }

  private transformSvg(svg: string): string {
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
