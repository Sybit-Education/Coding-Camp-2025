import { Injectable, inject } from '@angular/core'
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

  private readonly loadingSubject = new BehaviorSubject<boolean>(false)
  private readonly favoriteEventsSubject = new BehaviorSubject<Event[]>([])

  loading$ = this.loadingSubject.asObservable()
  favoriteEvents$ = this.favoriteEventsSubject.asObservable()

  constructor() {
    console.log('FavoriteService initialized');

    // Initialisiere den Service mit einem leeren Array
    this.favoriteEventsSubject.next([]);

    // Abonniere Änderungen an gespeicherten Events
    this.localStorageService.savedEvents$.subscribe(() => {
      console.log('Saved events changed, reloading favorites');
      this.loadFavoriteEvents();
    });

    // Lade Favoriten beim Start
    setTimeout(() => {
      this.loadFavoriteEvents()
    }, 0)
  }

  /**
   * Lädt alle favorisierten Events
   */
  async loadFavoriteEvents(): Promise<void> {
    this.loadingSubject.next(true)

    try {
      // Hole alle gespeicherten Event-IDs
      const savedEventIds = this.localStorageService.getSavedEventIds()

      if (savedEventIds.length === 0) {
        this.favoriteEventsSubject.next([])
        setTimeout(() => {
          this.loadingSubject.next(false)
        }, 0)
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
        const dateA = a.date_start instanceof Date ? a.date_start : new Date(a.date_start);
        const dateB = b.date_start instanceof Date ? b.date_start : new Date(b.date_start);
        return dateA.getTime() - dateB.getTime();
      });

      console.log(`Loaded and sorted ${sortedEvents.length} favorite events`);
      this.favoriteEventsSubject.next(sortedEvents);
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error)
      this.favoriteEventsSubject.next([])
    } finally {
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
