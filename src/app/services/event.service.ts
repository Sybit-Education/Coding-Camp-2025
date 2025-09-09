import { inject, Injectable, signal } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Event, EventType } from '../models/event.interface'
import { RecordId, StringRecordId, surql } from 'surrealdb'
import { TypeDB } from '../models/typeDB.interface'

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

  // Signals für häufig verwendete Daten
  readonly allEvents = signal<Event[]>([]);
  readonly allEventTypes = signal<TypeDB[]>([]);


  async initializeData(): Promise<void> {
    try {

      // Lade Daten parallel und aktualisiere Signals
      const [events, types] = await Promise.all([
        this.fetchAllEvents(),
        this.fetchAllEventTypes()
      ]);

      this.allEvents.set(events);
      this.allEventTypes.set(types);
    } catch (error) {
      console.error('Fehler beim Initialisieren der Event-Daten:', error);
    }
  }

  private async fetchAllEvents(): Promise<Event[]> {
    try {
      const result = await this.surrealdb.getAll<Event>('event')
      return (result || []).map(
        (item: Record<string, unknown>) => ({...item}) as Event
      )
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error);
      return [];
    }
  }

  private async fetchAllEventTypes(): Promise<TypeDB[]> {
    try {
      return await this.surrealdb.getAll('event_type')
    } catch (error) {
      console.error('Fehler beim Laden der Event-Typen:', error);
      return [];
    }
  }

  //************** GET **************
  async getEventByID(id: RecordId<'event'> | StringRecordId): Promise<Event> {
    const result = await this.surrealdb.getByRecordId<Event>(id)
    return result
  }

  // Timestamp für Cache-Invalidierung
  private lastEventsFetch = 0;
  private readonly CACHE_TTL = 60000; // 1 Minute Cache-Gültigkeit

  async getAllEvents(): Promise<Event[]> {
    // Verwende gecachte Daten, wenn verfügbar und nicht zu alt
    const cachedEvents = this.allEvents();
    const now = Date.now();

    if (cachedEvents.length > 0 && (now - this.lastEventsFetch) < this.CACHE_TTL) {
      return cachedEvents;
    }

    // Andernfalls lade Daten und aktualisiere Signal
    const events = await this.fetchAllEvents();
    this.allEvents.set(events);
    this.lastEventsFetch = now;
    return events;
  }

  async getAllEventTypes(): Promise<TypeDB[]> {
    // Verwende gecachte Daten, wenn verfügbar
    const cachedTypes = this.allEventTypes();
    if (cachedTypes.length > 0) {
      return cachedTypes;
    }

    // Andernfalls lade Daten und aktualisiere Signal
    const types = await this.fetchAllEventTypes();
    this.allEventTypes.set(types);
    return types;
  }

  async getEventTypeByID(
    id: RecordId<'event_type'> | StringRecordId,
  ): Promise<EventType> {
    const result = await this.surrealdb.getByRecordId<TypeDB>(id)
    const eventType = result.name as unknown as EventType
    return /^[A-Z_]+$/.test(eventType) ? eventType : EventType.UNKNOWN
  }

  async getEventsWithLocation(): Promise<Event[]> {
    try {
      const result = await this.surrealdb.query(
        surql`select *,location.* FROM event;`,
      )
      return Array.isArray(result?.[0]) ? result[0] : []
    } catch (error) {
      throw new Error(
        `Fehler beim Laden der Events mit Standortdetails: ${error}`,
      )
    }
  }

  //************** POST **************

  async postEvent(event: Event) {
    return await this.surrealdb.post<Event>('event', event)
  }

  async updateEvent(id: RecordId<'event'>, event: Event): Promise<Event> {
    return await this.surrealdb.postUpdate<Event>(id, event)
  }
}
