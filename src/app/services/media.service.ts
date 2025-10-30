import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Media } from '../models/media.interface'
import { RecordId, StringRecordId } from 'surrealdb'
import { environment } from '@environments/environment'
@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)

  private readonly mediaBaseUrl: string = environment.MEDIA_BASE_URL

  async postMedia(media: Media) {
    const result = await this.surrealdb.post<Media>('media', media)
    return result[0]
  }

  getMediaUrl(mediaRecordId: RecordId<'media'> | undefined): string | null {
    if (!mediaRecordId) return null

    try {
      const mediaURL = String(mediaRecordId)
        .replace(/_(?=[^_]*$)/, '.')
        .split(':')[1]
      return this.mediaBaseUrl + mediaURL
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

  async getMediaByUrl(url: string): Promise<Media | null> {
    try {
      const id = url.substring(url.lastIndexOf('/') + 1).replace('.', '_')
      const media = await this.surrealdb.getByRecordId<Media>(
        new StringRecordId(`media:${id}`),
      )
      return media || null
    } catch (error) {
      console.warn('Fehler beim Laden der Media:', error)
      return null
    }
  }

  /**
   * Löscht ein Medium aus der Datenbank
   * @param id Die ID des zu löschenden Mediums
   * @returns true wenn erfolgreich, sonst false
   */
  async deleteMedia(id: RecordId<'media'> | StringRecordId): Promise<boolean> {
    try {
      await this.surrealdb.deleteRow(id)
      console.log(`Medium mit ID ${id} erfolgreich gelöscht`)
      return true
    } catch (error) {
      console.error(`Fehler beim Löschen des Mediums mit ID ${id}:`, error)
      return false
    }
  }
}
