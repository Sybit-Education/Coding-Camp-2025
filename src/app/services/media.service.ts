import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Media } from '../models/media.model'
import { RecordId } from 'surrealdb'
@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

  async postMedia(media: Media) {
    const result = await this.surrealdb.post<Media>('media', media)
    return result[0]
  }

  async getMediaUrl(mediaRecordId: RecordId<'media'> | undefined): Promise<string | null> {
    if (!mediaRecordId) return null

    try {
      const media = await this.surrealdb.getByRecordId<Media>(mediaRecordId)

      if (media?.file) {
        return this.convertBase64ToDataUrl(media.file)
      }

      return null
    } catch (error) {
      console.warn('Fehler beim Laden der Media:', error)
      return null
    }
  }

  async getFirstMediaUrl(
    mediaArray: RecordId<'media'>[] | undefined,
  ): Promise<string | null> {
    if (!mediaArray || mediaArray.length === 0) return null
    return await this.getMediaUrl(mediaArray[0])
  }

  private convertBase64ToDataUrl(base64: string): string {
    if (base64.startsWith('data:')) return base64
    return `data:image/jpeg;base64,${base64}`
  }
}
