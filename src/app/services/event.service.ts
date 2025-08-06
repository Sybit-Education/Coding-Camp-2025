import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Event } from '../models/event.interface'
import { Location } from '../models/location.interface'
import { surql } from 'surrealdb'

@Injectable({
  providedIn: 'root',
})
export class EventService {

  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)



  async getEventByID(id: string): Promise<Event> {
    const result = await this.surrealdb.getById<Event>('event:'+id)
    console.log('event service: ', result)
    return result
  }

  async getLocationByID(id: string): Promise<Location> {
    console.log(id)
    const result = await this.surrealdb.getById<Location>('location:'+id)
    console.log('event service: ', result)
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
