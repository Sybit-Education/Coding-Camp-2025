import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Event } from '../models/event.interface'

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly SAVED_EVENTS_KEY = 'saved_events'
  private savedEventsSubject = new BehaviorSubject<string[]>(
    this.getSavedEventIds(),
  )

  savedEvents$ = this.savedEventsSubject.asObservable()

  saveEvent(eventId: string): void {
    const savedIds = this.getSavedEventIds()
    if (!savedIds.includes(eventId)) {
      savedIds.push(eventId)
      this.setSavedEventIds(savedIds)
      this.savedEventsSubject.next(savedIds)
    }
  }

  unsaveEvent(eventId: string): void {
    const savedIds = this.getSavedEventIds()
    const filteredIds = savedIds.filter((id) => id !== eventId)
    this.setSavedEventIds(filteredIds)
    this.savedEventsSubject.next(filteredIds)
  }

  isEventSaved(eventId: string): boolean {
    return this.getSavedEventIds().includes(eventId)
  }

  getSavedEventIds(): string[] {
    const savedEvents = localStorage.getItem(this.SAVED_EVENTS_KEY)
    return savedEvents ? JSON.parse(savedEvents) : []
  }

  private setSavedEventIds(eventIds: string[]): void {
    localStorage.setItem(this.SAVED_EVENTS_KEY, JSON.stringify(eventIds))
  }

  filterSavedEvents(events: Event[]): Event[] {
    const savedIds = this.getSavedEventIds()
    return events.filter((event) => event.id && savedIds.includes(event.id.id.toString()))
  }

  getSavedEventsCount(): number {
    return this.getSavedEventIds().length
  }
}
