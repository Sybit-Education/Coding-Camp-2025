import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Event } from '../models/event.interface'
import { surql, RecordId } from 'surrealdb'
import { TypeDB } from '../models/typeDB.interface'
@Injectable({
  providedIn: 'root',
})
export class EventService {
  private surrealdb: SurrealdbService = inject(SurrealdbService)

  //************** GET **************
  async getEventByID(id: string): Promise<Event> {
    const result = await this.surrealdb.getById<Event>('event:' + id)
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

  async getEventTypeByID(id: string): Promise<TypeDB> {
    return await this.surrealdb.getById<TypeDB>('event_type:' + id)
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
