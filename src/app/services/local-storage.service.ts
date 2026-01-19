import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { BehaviorSubject } from 'rxjs'
import { Event } from '../models/event.interface'

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly SAVED_EVENTS_KEY = 'saved_events'
  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)

  // Signal für reaktiven State
  readonly savedEventsSignal = signal<string[]>(this.getSavedEventIds())

  // BehaviorSubject für Abwärtskompatibilität
  private readonly savedEventsSubject = new BehaviorSubject<string[]>(this.getSavedEventIds())

  savedEvents$ = this.savedEventsSubject.asObservable()

  saveEvent(eventId: string | undefined): void {
    const savedIds = this.getSavedEventIds()
    if (eventId && !savedIds.includes(eventId)) {
      savedIds.push(eventId)
      this.setSavedEventIds(savedIds)

      // Beide State-Mechanismen aktualisieren
      this.savedEventsSignal.set(savedIds)
      this.savedEventsSubject.next(savedIds)
    }
  }

  unsaveEvent(eventId: string | undefined): void {
    const savedIds = this.getSavedEventIds()
    const filteredIds = savedIds.filter((id) => id !== eventId)
    this.setSavedEventIds(filteredIds)

    // Beide State-Mechanismen aktualisieren
    this.savedEventsSignal.set(filteredIds)
    this.savedEventsSubject.next(filteredIds)
  }

  isEventSaved(eventId: string | undefined): boolean {
    return this.getSavedEventIds().includes(eventId!)
  }

  getSavedEventIds(): string[] {
    if (!this.isBrowser) {
      return []
    }
    const savedEvents = localStorage.getItem(this.SAVED_EVENTS_KEY)
    const ids = savedEvents ? JSON.parse(savedEvents) : []
    return ids
  }

  private setSavedEventIds(eventIds: string[]): void {
    if (this.isBrowser) {
      localStorage.setItem(this.SAVED_EVENTS_KEY, JSON.stringify(eventIds))
    }
  }

  filterSavedEvents(events: Event[]): Event[] {
    const savedIds = this.getSavedEventIds()
    return events.filter((event) => event.id && savedIds.includes(String(event.id)))
  }

  getSavedEventsCount(): number {
    return this.getSavedEventIds().length
  }
}
