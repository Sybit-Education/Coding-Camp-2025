import { Injectable, inject, signal, effect } from '@angular/core'
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

  // Signals für reaktiven State - OHNE RxJS
  private readonly loadingState = signal<boolean>(false)
  private readonly favoriteEventsState = signal<Event[]>([])

  // Public readonly Signals
  readonly loading = this.loadingState.asReadonly()
  readonly favoriteEvents = this.favoriteEventsState.asReadonly()

  constructor() {
    // REMOVED: Effect that auto-reloads favorites on every savedEventsSignal change
    // This was causing performance issues because it triggered expensive DB queries
    // on every interaction. Favorites are now loaded explicitly via loadFavoriteEvents()
    // or initializeData() when needed.
  }

  async initializeData(): Promise<void> {
    // Initialisiere mit leerem Array
    this.favoriteEventsState.set([])
    
    // Lade Favoriten beim Start
    await this.loadFavoriteEvents()
  }

  /**
   * Lädt alle favorisierten Events
   */
  async loadFavoriteEvents(): Promise<void> {
    this.loadingState.set(true)

    try {
      // Hole alle gespeicherten Event-IDs
      const savedEventIds = this.localStorageService.getSavedEventIds()

      if (savedEventIds.length === 0) {
        this.favoriteEventsState.set([])
        this.loadingState.set(false)
        return
      }

      // Lade jedes Event einzeln
      const events: Event[] = []

      for (const id of savedEventIds) {
        try {
          // Prüfe, ob die ID bereits das "event:"-Präfix hat
          const recordId = id.startsWith('event:') ? new StringRecordId(id) : new StringRecordId(`event:${id}`)

          const event = await this.eventService.getEventByID(recordId)

          if (event) {
            events.push(event)
          } else {
            console.error(`Event with ID ${id} not found`)
          }
        } catch (err) {
          console.error(`Error loading event with ID ${id}:`, err)
        }
      }

      // Sortiere Events nach Startdatum (aufsteigend)
      const sortedEvents = events.toSorted((a, b) => {
        const dateA = a.date_start instanceof Date ? a.date_start : new Date(a.date_start)
        const dateB = b.date_start instanceof Date ? b.date_start : new Date(b.date_start)
        return dateA.getTime() - dateB.getTime()
      })

      this.favoriteEventsState.set(sortedEvents)
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error)
      this.favoriteEventsState.set([])
    } finally {
      this.loadingState.set(false)
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
