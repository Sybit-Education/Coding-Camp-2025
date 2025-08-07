import { Injectable } from '@angular/core';
import { Media } from '../models/media.interface';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private readonly baseUrl = 'https://1200-jahre-radolfzell.sybit.education/media/';
  private readonly fallbackImage = 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg';

  /**
   * Konvertiert Media-Objekt zu URL oder gibt Fallback zurück
   */
  getMediaUrl(media: Media[] | undefined | null): string {
    if (!media || !Array.isArray(media) || media.length === 0) {
      return this.fallbackImage;
    }
    
    const firstMedia = media[0];
    if (!firstMedia?.file) {
      return this.fallbackImage;
    }
    
    return this.baseUrl + firstMedia.file;
  }

  /**
   * Fallback für String-basierte Media (Legacy-Support)
   */
  getMediaUrlFromString(mediaString: string | undefined | null): string {
    if (!mediaString) {
      return this.fallbackImage;
    }
    
    // Falls es bereits eine vollständige URL ist
    if (mediaString.startsWith('http')) {
      return mediaString;
    }
    
    return this.baseUrl + mediaString;
  }
}