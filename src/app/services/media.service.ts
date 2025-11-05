import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Media, UploadMedia } from '../models/media.interface'
import { RecordId, StringRecordId } from 'surrealdb'
import { environment } from '@environments/environment'
import { HttpClient } from '@angular/common/http'
import { lastValueFrom } from 'rxjs'
@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)
  private readonly http = inject(HttpClient)

  private readonly mediaBaseUrl: string = environment.MEDIA_BASE_URL
  private readonly mediaGetSuffix: string = environment.MEDIA_GET_SUFFIX

  async postMedia(media: Media) {
    const result = await this.surrealdb.post<Media>('media', media)
    return result[0]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async postMediaToGoService(media: UploadMedia) {

    media.env = environment.configName

    const options = { headers: { 'Content-Type': 'application/json' } }

    const response = await lastValueFrom(
      this.http.post<{ success: boolean; id: string }>(`${this.mediaBaseUrl}/upload`, media, options),
    )

    const fullId = response.id.startsWith('media:')
      ? response.id
      : `media:${response.id}`

    return fullId as unknown as RecordId<'media'>
  }

  getMediaUrl(mediaRecordId: RecordId<'media'> | undefined): string | null {
    if (!mediaRecordId) return null

    try {
      const idString = String(mediaRecordId)
      const cleanId = idString.includes(':') ? idString.split(':')[1] : idString
      const mediaFileName = cleanId.replace(/_(?=[^_]*$)/, '.')

      return this.mediaBaseUrl + this.mediaGetSuffix + mediaFileName
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

  async getMediaById(mediaId: RecordId<'media'>): Promise<Media> {
    return await this.surrealdb.getByRecordId<Media>(mediaId)
  }

  async getMediasByIdList(mediaIds: RecordId<'media'>[]): Promise<Media[]> {
    const resultList: Media[] = []
    for (const mediaId of mediaIds) {
      resultList.push(await this.getMediaById(mediaId))
    }
    return resultList
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

  async updateMedia(id: RecordId<'media'>, media: Media) {
    const result = await this.surrealdb.postUpdate<Media>(id, media)
    return result
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
