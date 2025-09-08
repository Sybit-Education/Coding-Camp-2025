import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Media } from '../models/media.model'
import { RecordId, StringRecordId } from 'surrealdb'
@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

  private readonly mediaBaseUrl: string = 'https://1200-jahre-radolfzell.sybit.education/media/'

  async postMedia(media: Media) {
    const result = await this.surrealdb.post<Media>('media', media)
    return result[0]
  }

  async getMediaUrl(mediaRecordId: RecordId<'media'> | undefined): Promise<string | null> {
    if (!mediaRecordId) return null

    try {
      // Stelle sicher, dass die Verbindung initialisiert ist
      await this.surrealdb.initialize();
      
      const mediaURL = String(mediaRecordId).replace(/_(?=[^_]*$)/, '.').split(':')[1]
      const url = this.mediaBaseUrl + mediaURL;
      
      console.log('Media URL erstellt:', url, 'aus RecordId:', mediaRecordId);
      return url;

    } catch (error) {
      console.warn('Fehler beim Laden der Media:', error)
      return null
    }
  }

  async getFirstMediaUrl(
    mediaArray: RecordId<'media'>[] | undefined,
  ): Promise<string | null> {
    if (!mediaArray || mediaArray.length === 0) {
      console.log('Keine Media-IDs vorhanden');
      return null;
    }
    
    console.log('Lade erste Media aus:', mediaArray);
    return await this.getMediaUrl(mediaArray[0])
  }

  async getMediaByUrl(url: string): Promise<Media | null> {
    try {
      // Stelle sicher, dass die Verbindung initialisiert ist
      await this.surrealdb.initialize();
      
      const id = url.substring(url.lastIndexOf('/') + 1).replace('.', '_')
      const media = await this.surrealdb.getByRecordId<Media>(new StringRecordId(`media:${id}`))
      return media || null
    } catch (error) {
      console.warn('Fehler beim Laden der Media:', error)
      return null
    }
  }
}
