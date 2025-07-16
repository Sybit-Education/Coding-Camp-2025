import { Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Event } from '../models/event.interface'
import { surql } from 'surrealdb'

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private readonly surrealdb: SurrealdbService) {}

  async getAllEvents(): Promise<Event[]> {
    try {
      const result = await this.surrealdb.select('event')
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

  async initializeDatabase(): Promise<void> {
    await this.surrealdb.initialize()
  }
}
