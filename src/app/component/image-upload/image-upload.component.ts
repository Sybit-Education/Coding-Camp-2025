import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { RecordId, StringRecordId } from 'surrealdb'
import { MediaService } from '../../services/media.service'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { Media } from '../../models/media.interface'
import { SnackBarService } from '../../services/snack-bar.service'
import { TranslateModule } from '@ngx-translate/core'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, TranslateModule,FormsModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent implements OnInit, OnChanges {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>

  @Input() previews: string[] = []
  @Input() eventName = ''
  @Input() existingImages: Media[] = []

  @Output() previewsChange = new EventEmitter<string[]>()
  @Output() mediaChange = new EventEmitter<Media[]>()

  isDragging = false

  openSettingsIndex: number | null = null;
  pictureInfos: { copyright: string; creator: string }[] = [];

  private readonly mediaService = inject(MediaService)
  private readonly markForCheck = injectMarkForCheck()
  private readonly snackBarService = inject(SnackBarService)

  ngOnInit(): void {
    // Lade existierende Bilder, wenn vorhanden
    this.loadExistingImagesIfPresent()
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Wenn sich existingImages ändert und Werte enthält, lade die Bilder
    if (
      changes['existingImages'] &&
      changes['existingImages'].currentValue &&
      changes['existingImages'].currentValue.length > 0
    ) {
      this.loadExistingImagesIfPresent()
    }
  }

  private loadExistingImagesIfPresent(): void {
    if (this.existingImages && this.existingImages.length > 0) {
      // Nur laden, wenn die Vorschau noch leer ist, um Duplikate zu vermeiden
      if (this.previews.length === 0) {
        this.loadExistingImages()
      }
    }
  }

  // ===== File Upload Handling =====
  onAreaClick() {
    this.fileInput.nativeElement.click()
  }

  onDragOver(event: DragEvent) {
    event.preventDefault()
    this.isDragging = true
  }

  onDragLeave() {
    this.isDragging = false
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    this.isDragging = false
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files))
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) return
    this.handleFiles(Array.from(input.files))
    input.value = ''
  }

  private handleFiles(selected: File[]) {
    for (const file of selected) {
      if (!RegExp(/image\/(png|jpeg)/).exec(file.type)) {
        this.snackBarService.showError(`Dateityp nicht erlaubt: ${file.name}`)
        continue
      }
      const maxFileSize = 5 * 1024 * 1024
      if (file.size > maxFileSize) {
        this.snackBarService.showError(
          `Datei zu groß (max. 5 MB): ${file.name}`,
        )
        continue
      }
      this.createPreview(file)
    }
  }

  private createPreview(file?: File | null) {
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Speichere den Dateinamen und MIME-Type als Metadaten
          const dataWithMetadata = {
            dataUrl: reader.result,
            fileName: file.name,
            mimeType: file.type,
          }
          // Speichere das Objekt als JSON-String
          this.previews.push(JSON.stringify(dataWithMetadata))
          this.previewsChange.emit(this.previews)
          this.markForCheck()
        }
      }
      reader.readAsDataURL(file)
    }
  }

  private loadExistingImages() {
    console.log('Lade existierende Bilder:', this.existingImages)
    this.existingImages.forEach((image) => {
      const url = this.mediaService.getMediaUrl(image.id)

      if (url) {
        // Prüfen, ob das Bild bereits in den Vorschauen vorhanden ist
        if (!this.previews.includes(url)) {
          this.previews.push(url)
          this.previewsChange.emit(this.previews)
          this.markForCheck()
        }
      } else {
        console.warn('Konnte Bild-URL nicht laden für Media-ID:', image)
      }
    })
  }

  async removeImage(index: number) {
    // Speichere das zu löschende Bild
    const imageToRemove = this.previews[index]

    // Entferne das Bild aus der Vorschau
    this.previews.splice(index, 1)
    this.previewsChange.emit(this.previews)

    try {
      // Wenn es ein HTTP-Bild ist (existierendes Bild), finde die Media-ID und lösche es
      if (imageToRemove.startsWith('http')) {
        const existingMedia =
          await this.mediaService.getMediaByUrl(imageToRemove)
        if (existingMedia && existingMedia.id) {
          console.log(
            'Lösche existierendes Bild aus der Datenbank:',
            existingMedia.id,
          )
          const deleted = await this.mediaService.deleteMedia(existingMedia.id)
          if (deleted) {
            console.log(`Bild mit ID ${existingMedia.id} erfolgreich gelöscht`)
          } else {
            console.warn(
              `Bild mit ID ${existingMedia.id} konnte nicht gelöscht werden`,
            )
          }
        }
      }

      // Aktualisiere die Media-IDs und informiere die Eltern-Komponente
      const media = await this.uploadImages()
      this.mediaChange.emit(media)
    } catch (error) {
      console.error('Fehler beim Löschen des Bildes:', error)
      this.snackBarService.showError(
        `Fehler beim Löschen des Bildes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      )
    }
  }

  /**
   * Extrahiert die korrekte Bild-URL aus dem Preview-String
   * Unterstützt sowohl normale URLs als auch JSON-Strings mit Metadaten
   */
  getSrcForPreview(src: string): string {
    if (src.startsWith('http')) {
      return src
    }

    try {
      if (src.startsWith('{') && src.endsWith('}')) {
        const imageData = JSON.parse(src)
        return imageData.dataUrl
      }
    } catch (e) {
      console.error('Fehler beim Parsen des JSON-Strings:', e)
    }

    return src
  }

  async uploadImages(): Promise<Media[]> {
    const result: Media[] = []

    try {
      // Wenn keine Vorschaubilder vorhanden sind, aber existierende Bilder übergeben wurden,
      // geben wir die existierenden Bilder zurück
      if (this.previews.length === 0 && this.existingImages.length > 0) {
        console.log(
          'Keine neuen Bilder, behalte existierende:',
          this.existingImages,
        )
        return [...this.existingImages]
      }

      // Zuerst existierende Medien sammeln
      for (const image of this.previews) {
        if (image.startsWith('http')) {
          try {
            const existingMedia = await this.mediaService.getMediaByUrl(image)
            if (existingMedia && existingMedia.id) {
              result.push(existingMedia)
            } else {
              // Wenn wir keine Media-ID für die URL finden können,
              // versuchen wir, die ID aus den existingImages zu finden
              const matchingExistingImage = this.existingImages.find(
                async (media) => {
                  const url = await this.mediaService.getMediaUrl(media.id)
                  return url === image
                },
              )

              if (matchingExistingImage) {
                result.push(matchingExistingImage)
              }
            }
          } catch (error) {
            console.error(
              'Fehler beim Abrufen des existierenden Mediums:',
              error,
            )
          }
        }
      }

      // Dann neue Bilder hochladen
      const newImages = this.previews.filter((img) => !img.startsWith('http'))

      const resultMedias: Media[] = (
        await Promise.all(
          newImages.map(async (image: string, i: number) => {
            try {
              let file: string
              let fileName: string
              let fileType: string

              // Prüfen, ob es sich um ein JSON-Objekt mit Metadaten handelt
              if (image.startsWith('{') && image.endsWith('}')) {
                try {
                  const imageData = JSON.parse(image)
                  file = imageData.dataUrl.split(',')[1]
                  fileName = imageData.fileName
                  // Extrahiere den MIME-Type aus dem vollständigen Type
                  fileType = imageData.mimeType.split('/')[1]
                  // oxlint-disable-next-line no-unused-vars
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) {
                  // Fallback, falls JSON-Parsing fehlschlägt
                  file = image.split(',')[1]
                  fileName = `${this.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`
                  fileType = image.split(';')[0].split('/')[1]
                }
              } else {
                // Fallback für ältere Daten ohne Metadaten
                file = image.split(',')[1]
                fileName = `${this.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`
                fileType = image.split(';')[0].split('/')[1]
              }

              const info = this.pictureInfos[i] || { copyright: '', creator: '' }

              // Eindeutige ID generieren
              const uniqueId = new StringRecordId(
                `media:${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
              )
              console.log('uniqueID: ' + uniqueId)

              const newMedia: Media = {
                id: uniqueId as unknown as RecordId<'media'>,
                file: file,
                fileName: fileName,
                fileType: fileType,
                copyright: info.copyright || '',
                creator: info.creator || '',
              }
              return await this.mediaService.postMedia(newMedia)
            } catch (error) {
              console.error(`Fehler beim Verarbeiten des Bildes ${i}:`, error)
              this.snackBarService.showError(
                `Fehler beim Hochladen des Bildes ${i + 1}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
              )
              this.markForCheck()
              return null
            }
          }),
        )
      ).filter((media): media is Media => media !== null)

      // Neue Media-IDs hinzufügen
      result.push(...resultMedias.map((media) => media))

      // Event emittieren mit allen Media-IDs
      this.mediaChange.emit(result)

      console.log('Hochgeladene und existierende Medien:', result)
      return result
    } catch (error) {
      console.error('Fehler beim Hochladen der Bilder:', error)
      this.snackBarService.showError(
        `Fehler beim Hochladen der Bilder: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      )
      this.markForCheck()
      return result
    }
  }

  openPictureSettings(index: number) {
    if (!this.pictureInfos[index]) {
      this.pictureInfos[index] = { copyright: '', creator: '' };
    }
    this.openSettingsIndex = index;
  }

  closePictureSettings() {
    this.openSettingsIndex = null;
  }

  async saveSettings(index: number, copyright: string, creator: string) {
  const info = this.pictureInfos[index];
  if (!info) return;

  try {
    const previewData = this.previews[index];

    if (previewData.startsWith('{') && previewData.endsWith('}')) {
      const parsed = JSON.parse(previewData);
      parsed.copyright = info.copyright || '';
      parsed.creator = info.creator || '';
      this.previews[index] = JSON.stringify(parsed);
    }

    else if (previewData.startsWith('http')) {
      const media = await this.mediaService.getMediaByUrl(previewData)
      // if(media){
      // TODO: add exception
      // }
      media!.copyright = copyright
      media!.creator = creator
      this.mediaService.updateMedia(media!.id!, media!)
    }

    this.previewsChange.emit(this.previews);
    this.markForCheck();
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Bilddaten:', error);
  }
}

}
