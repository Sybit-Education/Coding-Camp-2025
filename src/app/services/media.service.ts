import { Injectable, inject } from '@angular/core';
import { Media } from '../models/media.interface';
import { SurrealdbService } from './surrealdb.service';
import { RecordId } from 'surrealdb';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private readonly surrealdbService = inject(SurrealdbService);

  async getMediaUrl(mediaRecordId: RecordId<'media'> | string | any | undefined): Promise<string | null> {
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
      
      const media = await this.surrealdbService.getById<Media>(mediaId);
      
      if (media?.file) {
        return this.convertBase64ToDataUrl(media.file, media.fileType);
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

  private convertBase64ToDataUrl(base64: string, fileType?: string): string {
    if (base64.startsWith('data:')) return base64;
    const mimeType = this.getMimeType(fileType);
    return `data:${mimeType};base64,${base64}`;
  }

  private getMimeType(fileType?: string): string {
    if (!fileType) return 'image/jpeg';
    
    const type = fileType.toLowerCase();
    if (type.includes('png')) return 'image/png';
    if (type.includes('gif')) return 'image/gif';
    if (type.includes('webp')) return 'image/webp';
    if (type.includes('svg')) return 'image/svg+xml';
    
    return 'image/jpeg';
  }
}