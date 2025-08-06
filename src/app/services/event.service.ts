import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Event, EventType } from '../models/event.interface'
import { Location } from '../models/location.interface'
import { surql } from 'surrealdb'
import { TypeDB } from '../models/typeDB.interface'
import { Organizer } from '../models/organizer.interface'

@Injectable({
  providedIn: 'root',
})
export class EventService {

  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

  async getEventByID(id: string): Promise<Event> {
    const result = await this.surrealdb.getById<Event>('event:'+id)
    return result
  }

  async getLocationByID(id: string): Promise<Location> {
    const result = await this.surrealdb.getById<Location>('location:'+id)
    return result
  }

   async getTypeByID(id: string): Promise<EventType> {
    const result = await this.surrealdb.getById<TypeDB>('event:'+id)
    const eventType = result.name as unknown as EventType
    return /^[A-Z_]+$/.test(eventType) ? eventType : EventType.UNKNOWN
  }

  async getOrganizerByID(id: string): Promise<Organizer> {
    const result = await this.surrealdb.getById<Organizer>('organizer:'+id)
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
          }) as Event,
      )
    } catch (error) {
      throw new Error(`Fehler beim Laden der Events: ${error}`)
    }
  }


  /**
   * BSP payload für create:
   *
   * id: event.id,
      name: event['name'],
      description: event['description'],
      location: event['location'],
      date_start: event['date_start'],
      date_end: event['date_end'],
      price: event['price'],
      organizer: event['organizer'],
      media: event['media'],
      event_type: event['event_type'],
   */

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
}
