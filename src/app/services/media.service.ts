import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Event } from '../models/event.interface'
import { Media } from '../models/media.model'
import { RecordId } from 'surrealdb'
@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

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

   async getMediaUrl(mediaRecordId: RecordId<'media'> | string | undefined): Promise<string | null> {
    if (!mediaRecordId) return null;
    
    try {
      let mediaId: string;
      
      if (typeof mediaRecordId === 'object' && mediaRecordId.tb && mediaRecordId.id) {
        mediaId = mediaRecordId.tb + ':' + mediaRecordId.id;
      } else if (typeof mediaRecordId === 'string') {
        mediaId = mediaRecordId;
      } else {
        return null;
      }
      
      const media = await this.surrealdb.getById<Media>(mediaId);
      
      if (media?.file) {
        return this.convertBase64ToDataUrl(media.file);
      }
      
      return null;
    } catch (error) {
      console.warn('Fehler beim Laden der Media:', error);
      return null;
    }
  }

  async getFirstMediaUrl(mediaArray: RecordId<'media'>[] | undefined): Promise<string | null> {
    if (!mediaArray || mediaArray.length === 0) return null;
    return await this.getMediaUrl(mediaArray[0]);
  }

  private convertBase64ToDataUrl(base64: string): string {
    if (base64.startsWith('data:')) return base64;
    return `data:image/jpeg;base64,${base64}`;
  }
}
