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
      map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg)),
      shareReplay(1),
    )

    this.cache.set(name, stream)
    return stream
  }

}
