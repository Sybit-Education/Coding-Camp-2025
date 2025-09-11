import { Injectable, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { BehaviorSubject } from 'rxjs'
import { Event } from '../models/event.interface'
import { LocalStorageService } from './local-storage.service'
import { EventService } from './event.service'
import { StringRecordId } from 'surrealdb'

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  readonly localStorageService = inject(LocalStorageService)
  private readonly eventService = inject(EventService)

  // Für Abwärtskompatibilität - muss vor Verwendung initialisiert werden
  private readonly loadingSubject = new BehaviorSubject<boolean>(false)

  // Signals für reaktiven State
  private readonly loadingState = signal<boolean>(false)
  private readonly favoriteEventsSubject = new BehaviorSubject<Event[]>([])

  // Observables für Abwärtskompatibilität
  loading$ = this.loadingSubject.asObservable()
  favoriteEvents$ = this.favoriteEventsSubject.asObservable()

  // Signals für zoneless Angular
  readonly loading = toSignal(this.loading$, { initialValue: false })
  readonly favoriteEvents = toSignal(this.favoriteEvents$, {
    initialValue: [] as Event[],
  })

  constructor() {
    console.log('FavoriteService initialized')

    // Initialisiere den Service mit einem leeren Array
    this.favoriteEventsSubject.next([])

    // Effekt für Änderungen an gespeicherten Events
    // In einer vollständigen Implementierung würde hier effect() verwendet werden
    this.localStorageService.savedEvents$.subscribe(() => {
      console.log('Saved events changed, reloading favorites')
      this.loadFavoriteEvents()
    })

    // Lade Favoriten beim Start
    setTimeout(() => {
      this.loadFavoriteEvents()
    }, 0)
  }

  /**
   * Lädt alle favorisierten Events
   */
  async loadFavoriteEvents(): Promise<void> {
    // Signal und Subject aktualisieren
    this.loadingState.set(true)
    this.loadingSubject.next(true)

    try {
      // Hole alle gespeicherten Event-IDs
      const savedEventIds = this.localStorageService.getSavedEventIds()

      if (savedEventIds.length === 0) {
        this.favoriteEventsSubject.next([])
        this.loadingState.set(false)
        this.loadingSubject.next(false)
        return
      }

      // Lade jedes Event einzeln
      const events: Event[] = []

      for (const id of savedEventIds) {
        try {
          // Prüfe, ob die ID bereits das "event:"-Präfix hat
          const recordId = id.startsWith('event:')
            ? new StringRecordId(id)
            : new StringRecordId(`event:${id}`)

          const event = await this.eventService.getEventByID(recordId)

          if (event) {
            events.push(event)
          } else {
            console.log(`Event with ID ${id} not found`)
          }
        } catch (err) {
          console.error(`Error loading event with ID ${id}:`, err)
        }
      }

      // Sortiere Events nach Startdatum (aufsteigend)
      const sortedEvents = events.toSorted((a, b) => {
        const dateA =
          a.date_start instanceof Date ? a.date_start : new Date(a.date_start)
        const dateB =
          b.date_start instanceof Date ? b.date_start : new Date(b.date_start)
        return dateA.getTime() - dateB.getTime()
      })

      console.log(`Loaded and sorted ${sortedEvents.length} favorite events`)
      this.favoriteEventsSubject.next(sortedEvents)
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error)
      this.favoriteEventsSubject.next([])
    } finally {
      this.loadingState.set(false)
      this.loadingSubject.next(false)
    }
  }

  /**
   * Prüft, ob ein Event favorisiert ist
   */
  isEventFavorite(eventId: string): boolean {
    return this.localStorageService.isEventSaved(eventId)
  }

  /**
   * Fügt ein Event zu den Favoriten hinzu
   */
  addToFavorites(eventId: string): void {
    this.localStorageService.saveEvent(eventId)
  }

  /**
   * Entfernt ein Event aus den Favoriten
   */
  removeFromFavorites(eventId: string): void {
    this.localStorageService.unsaveEvent(eventId)
  }

  /**
   * Wechselt den Favoriten-Status eines Events
   */
  toggleFavorite(eventId: string): void {
    if (this.isEventFavorite(eventId)) {
      this.removeFromFavorites(eventId)
    } else {
      this.addToFavorites(eventId)
    }
  }

  /**
   * Gibt die Anzahl der favorisierten Events zurück
   */
  getFavoriteCount(): number {
    return this.localStorageService.getSavedEventsCount()
  }
}
