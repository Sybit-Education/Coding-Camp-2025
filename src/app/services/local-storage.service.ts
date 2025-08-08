import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Event } from '../models/event.interface'

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly SAVED_EVENTS_KEY = 'saved_events'
  private readonly savedEventsSubject = new BehaviorSubject<string[]>(
    this.getSavedEventIds(),
  )

  savedEvents$ = this.savedEventsSubject.asObservable()

  saveEvent(eventId: string | undefined): void {
    const savedIds = this.getSavedEventIds()
    if (eventId && !savedIds.includes(eventId)) {
      savedIds.push(eventId)
      this.setSavedEventIds(savedIds)
      this.savedEventsSubject.next(savedIds)
      console.log(`Event ${eventId} zu Favoriten hinzugefügt`)
    }
  }

  unsaveEvent(eventId: string | undefined): void {
    const savedIds = this.getSavedEventIds()
    const filteredIds = savedIds.filter((id) => id !== eventId)
    this.setSavedEventIds(filteredIds)
    this.savedEventsSubject.next(filteredIds)
    console.log(`Event ${eventId} aus Favoriten entfernt`)
  }

  isEventSaved(eventId: string | undefined): boolean {
    return this.getSavedEventIds().includes(eventId!)
  }

  getSavedEventIds(): string[] {
    const savedEvents = localStorage.getItem(this.SAVED_EVENTS_KEY)
    const ids = savedEvents ? JSON.parse(savedEvents) : []
    console.log('Retrieved saved event IDs from localStorage:', ids);
    return ids;
  }

  private setSavedEventIds(eventIds: string[]): void {
    localStorage.setItem(this.SAVED_EVENTS_KEY, JSON.stringify(eventIds))
  }

  filterSavedEvents(events: Event[]): Event[] {
    const savedIds = this.getSavedEventIds()
    return events.filter((event) => event.id && savedIds.includes(String(event.id)))
  }

  getSavedEventsCount(): number {
    return this.getSavedEventIds().length
  }
}