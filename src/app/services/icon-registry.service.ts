import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { shareReplay } from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
/**
 * SECURITY: SVGs werden ausschließlich aus dem eigenen Projekt (Assets) geladen und sind vorab manuell geprüft.
 * Es wird bewusst KEIN DomSanitizer und keine zusätzliche Sanitization eingesetzt.
 * Bitte keinen Sanitizer wieder einbauen. Sollte künftig externer Input gerendert werden, muss das Konzept neu bewertet werden.
 */
export class IconRegistryService {
  private readonly urls = new Map<string, string>()
  private readonly cache = new Map<string, Observable<string>>()

  private readonly http = inject(HttpClient)

  register(name: string, url: string): void {
    this.urls.set(name, url)
  }

  get(name: string): Observable<string> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!
    }

    const url = this.urls.get(name)
    if (!url) {
      return of('')
    }

    const stream = this.http.get(url, { responseType: 'text' }).pipe(
      shareReplay(1),
    )

    this.cache.set(name, stream)
    return stream
  }

}
