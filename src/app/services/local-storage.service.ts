import { Injectable, signal } from '@angular/core'
import { Event } from '../models/event.interface'

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly SAVED_EVENTS_KEY = 'saved_events'

  // Signal für reaktiven State - OHNE RxJS
  readonly savedEventsSignal = signal<string[]>(this.getSavedEventIds())

  saveEvent(eventId: string | undefined): void {
    const savedIds = this.getSavedEventIds()
    if (eventId && !savedIds.includes(eventId)) {
      savedIds.push(eventId)
      this.setSavedEventIds(savedIds)
      this.savedEventsSignal.set(savedIds)
    }
  }

  unsaveEvent(eventId: string | undefined): void {
    const savedIds = this.getSavedEventIds()
    const filteredIds = savedIds.filter((id) => id !== eventId)
    this.setSavedEventIds(filteredIds)
    this.savedEventsSignal.set(filteredIds)
  }

  isEventSaved(eventId: string | undefined): boolean {
    return this.getSavedEventIds().includes(eventId!)
  }

  getSavedEventIds(): string[] {
    const savedEvents = localStorage.getItem(this.SAVED_EVENTS_KEY)
    const ids = savedEvents ? JSON.parse(savedEvents) : []
    return ids
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
