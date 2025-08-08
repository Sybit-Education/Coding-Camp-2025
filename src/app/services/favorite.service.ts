import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Event } from '../models/event.interface';
import { LocalStorageService } from './local-storage.service';
import { EventService } from './event.service';
import { StringRecordId } from 'surrealdb';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly eventService = inject(EventService);

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly favoriteEventsSubject = new BehaviorSubject<Event[]>([]);

  loading$ = this.loadingSubject.asObservable();
  favoriteEvents$ = this.favoriteEventsSubject.asObservable();

  constructor() {
    // Abonniere Änderungen an gespeicherten Events
    this.localStorageService.savedEvents$.subscribe(() => {
      this.loadFavoriteEvents();
    });
  }

  /**
   * Lädt alle favorisierten Events
   */
  async loadFavoriteEvents(): Promise<void> {
    this.loadingSubject.next(true);

    try {
      // Hole alle gespeicherten Event-IDs
      const savedEventIds = this.localStorageService.getSavedEventIds();

      if (savedEventIds.length === 0) {
        this.favoriteEventsSubject.next([]);
        this.loadingSubject.next(false);
        return;
      }

      console.log('Loading favorite events for IDs:', savedEventIds);

      // Lade jedes Event einzeln
      const eventPromises = savedEventIds.map(id => {
        const recordId = new StringRecordId(`event:${id}`);
        return this.eventService.getEventByID(recordId);
      });

      const events = await Promise.all(eventPromises);
      const validEvents = events.filter(event => event !== null) as Event[];

      console.log('Loaded favorite events:', validEvents);
      this.favoriteEventsSubject.next(validEvents);
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error);
      this.favoriteEventsSubject.next([]);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Prüft, ob ein Event favorisiert ist
   */
  isEventFavorite(eventId: string): boolean {
    return this.localStorageService.isEventSaved(eventId);
  }

  /**
   * Fügt ein Event zu den Favoriten hinzu
   */
  addToFavorites(eventId: string): void {
    this.localStorageService.saveEvent(eventId);
  }

  /**
   * Entfernt ein Event aus den Favoriten
   */
  removeFromFavorites(eventId: string): void {
    this.localStorageService.unsaveEvent(eventId);
  }

  /**
   * Wechselt den Favoriten-Status eines Events
   */
  toggleFavorite(eventId: string): void {
    if (this.isEventFavorite(eventId)) {
      this.removeFromFavorites(eventId);
    } else {
      this.addToFavorites(eventId);
    }
  }

  /**
   * Gibt die Anzahl der favorisierten Events zurück
   */
  getFavoriteCount(): number {
    return this.localStorageService.getSavedEventsCount();
  }
}
