import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Event, EventType } from '../models/event.interface'
import { Media } from '../models/media.model'
@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private surrealdb: SurrealdbService = inject(SurrealdbService)

  //************** GET **************
  async getMediaByID(id: string): Promise<Event> {
    const result = await this.surrealdb.getById<Event>('event:' + id)
    return result
  }

  async getAllMedias(): Promise<Event[]> {
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

  //************** POST **************

  async postMedia(media: Media) {
    const result = await this.surrealdb.post<Media>('media', media)
    return result[0]
  }
}
