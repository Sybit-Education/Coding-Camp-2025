import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Event, EventType } from '../models/event.interface'
import { RecordId, StringRecordId, surql } from 'surrealdb'
import { TypeDB } from '../models/typeDB.interface'
@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

  //************** GET **************
  async getEventByID(id: RecordId<'event'> | StringRecordId): Promise<Event> {
    const result = await this.surrealdb.getByRecordId<Event>(id)
    return result
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      const result = await this.surrealdb.getAll<Event>('event')
      return (result || []).map(
        (item: Record<string, unknown>) =>
          ({
            ...item,
            id: item['id']?.toString() || '',
          }) as unknown as Event,
      )
    } catch (error) {
      throw new Error(`Fehler beim Laden der Events: ${error}`)
    }
  }

  async getAllEventTypes(): Promise<TypeDB[]> {
    try {
      return await this.surrealdb.getAll('event_type')
    } catch (error) {
      throw new Error(`Fehler beim Laden der Events: ${error}`)
    }
  }

  async getEventTypeByID(id: RecordId<'event_type'> | StringRecordId): Promise<EventType> {
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
    const stringId = new StringRecordId(id)
    const testId = stringId.toString()
    return await this.surrealdb.postUpdate<Event>(testId, event)
  }
}
