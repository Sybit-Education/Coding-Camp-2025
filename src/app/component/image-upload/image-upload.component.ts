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
  imports: [CommonModule, TranslateModule, FormsModule],
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

  openSettingsIndex: number | null = null
  pictureInfos: { copyright: string; creator: string }[] = []

  private readonly mediaService = inject(MediaService)
  private readonly markForCheck = injectMarkForCheck()
  private readonly snackBarService = inject(SnackBarService)

  ngOnInit(): void {
    // Lade existierende Bilder, wenn vorhanden
    this.loadExistingImagesIfPresent()
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Wenn sich existingImages ändert und Werte enthält, lade die Bilder
    if (changes['existingImages']?.currentValue.length > 0) {
      this.loadExistingImagesIfPresent()
    }
  }

  private async loadExistingImagesIfPresent(): Promise<void> {
    if (this.existingImages.length > 0) {
      if (this.previews.length === 0) {
        console.log('Lade existierende Bilder:', this.existingImages)
        this.existingImages.forEach((image, index) => {
          const url = this.mediaService.getMediaUrl(image.id)

          if (url && !this.previews.includes(url)) {
            this.previews.push(url)
            this.previewsChange.emit(this.previews)

            // 🟩 initialize pictureInfos for existing images
            this.pictureInfos[index] = {
              copyright: image.copyright || '',
              creator: image.creator || '',
            }
          }
        })
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
        if (existingMedia?.id) {
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

private idToString(
  id: RecordId<'media'> | StringRecordId | string | undefined | null,
): string {
  if (!id) return ''
  if (typeof id === 'string') return id
  // Versuche toString() der Surreal-IDs zu nutzen
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (id as any).toString?.()
    if (typeof s === 'string' && s.length > 0) return s
  // eslint-disable-next-line no-empty
  } catch {}
  // Fallback: bekannte Felder zusammen setzen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyId = id as any
  if (anyId?.tb && anyId?.id) return `${anyId.tb}:${anyId.id}`
  if (anyId?.id) return `media:${anyId.id}`
  return String(id)
}

async uploadImages(): Promise<Media[]> {
  const collected: Media[] = []

  try {
    // 1) Früher Exit: keine Previews, aber vorhandene Bilder
    if (this.previews.length === 0 && this.existingImages.length > 0) {
      const copy = [...this.existingImages]
      this.mediaChange.emit(copy)
      return copy
    }

    // 2) Existierende Medien aus Preview-URLs einsammeln
    for (const preview of this.previews) {
      if (!preview.startsWith('http')) continue

      try {
        const existingViaUrl = await this.mediaService.getMediaByUrl(preview)
        if (existingViaUrl?.id) {
          // Duplikate vermeiden (nach String-ID)
          const existingIdStr = this.idToString(existingViaUrl.id)
          if (!collected.some(m => this.idToString(m.id) === existingIdStr)) {
            collected.push(existingViaUrl)
          }
          continue
        }

        // Fallback: in existingImages passende URL suchen
        for (const existing of this.existingImages) {
          const url = await this.mediaService.getMediaUrl(existing.id)
          if (url === preview) {
            const existingIdStr = this.idToString(existing.id)
            if (!collected.some(m => this.idToString(m.id) === existingIdStr)) {
              collected.push(existing)
            }
            break
          }
        }
      } catch (error) {
        console.error('Fehler beim Auflösen existierender Media-URL:', error)
      }
    }

    // 3) Neue Bilder (Base64/JSON) hochladen
    const newImagePreviews = this.previews.filter(p => !p.startsWith('http'))

    for (let index = 0; index < newImagePreviews.length; index++) {
      const raw = newImagePreviews[index]

      try {
        // --- a) Datei + Metadaten extrahieren ---
        let base64Payload: string
        let originalFileName: string
        let fileType: string

        if (raw.startsWith('{') && raw.endsWith('}')) {
          const imageData = JSON.parse(raw) as {
            dataUrl: string
            fileName: string
            mimeType: string
            copyright?: string
            creator?: string
          }
          base64Payload = imageData.dataUrl.split(',')[1]
          originalFileName = imageData.fileName
          fileType = imageData.mimeType.split('/')[1]
        } else {
          base64Payload = raw.split(',')[1]
          fileType = raw.split(';')[0].split('/')[1]
          originalFileName = `${this.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${index}_${Date.now()}`
        }

        const info = this.pictureInfos[index] ?? { copyright: '', creator: '' }

        // --- b) ID generieren ---
        const sanitizedEventName = this.eventName.replace(/[^a-zA-Z0-9]/g, '_')
        const timestamp = Date.now()
        const uniqueId = new StringRecordId(
          `media:${sanitizedEventName}_${index}_${timestamp}_${fileType}`,
        ) as unknown as RecordId<'media'>

        // --- c) Media-Objekt für Upload ---
        const mediaToUpload: Media = {
          id: uniqueId,
          file: base64Payload, // nur Base64-Part
          fileName: originalFileName,
          fileType: fileType,
          copyright: info.copyright,
          creator: info.creator,
        }

        // --- d) Upload → erhält ID (RecordId<'media'> | string)
        const uploadedId = await this.mediaService.postMediaToGoService(mediaToUpload)

        // In String normalisieren
        const uploadedIdStr = this.idToString(
          uploadedId as unknown as RecordId<'media'> | string,
        )

        // RecordId für getMediaById bauen
        const uploadedRecordId =
          typeof uploadedId === 'string'
            ? (new StringRecordId(uploadedIdStr) as unknown as RecordId<'media'>)
            : (uploadedId as RecordId<'media'>)

        // Details laden (falls Service kein vollständiges Media zurückgibt)
        const uploadedMedia = await this.mediaService.getMediaById(uploadedRecordId)

        // Duplikate vermeiden
        if (!collected.some(m => this.idToString(m.id) === uploadedIdStr)) {
          collected.push(uploadedMedia)
        }
      } catch (error) {
        console.error(`Fehler beim Upload des Bildes #${index + 1}:`, error)
        this.snackBarService.showError(
          `Fehler beim Hochladen des Bildes ${index + 1}: ${
            error instanceof Error ? error.message : 'Unbekannter Fehler'
          }`,
        )
      }
    }

    // 4) Einmalig emittieren & zurückgeben
    this.mediaChange.emit(collected)
    console.log('Hochgeladene und existierende Medien:', collected)
    return collected
  } catch (error) {
    console.error('Fehler beim Hochladen der Bilder:', error)
    this.snackBarService.showError(
      `Fehler beim Hochladen der Bilder: ${
        error instanceof Error ? error.message : 'Unbekannter Fehler'
      }`,
    )
    this.mediaChange.emit(collected)
    return collected
  }
}



  openPictureSettings(index: number) {
    if (!this.pictureInfos[index]) {
      this.pictureInfos[index] = { copyright: '', creator: '' }
    }
    this.openSettingsIndex = index
  }

  closePictureSettings() {
    this.openSettingsIndex = null
  }

  async saveSettings(index: number) {
    const info = this.pictureInfos[index]
    if (!info) return

    try {
      const previewData = this.previews[index]

      if (previewData.startsWith('{') && previewData.endsWith('}')) {
        const parsed = JSON.parse(previewData)
        parsed.copyright = info.copyright || ''
        parsed.creator = info.creator || ''
        this.previews[index] = JSON.stringify(parsed)
      } else if (previewData.startsWith('http')) {
        const media = await this.mediaService.getMediaByUrl(previewData)
        // if(media){
        // TODO: add exception
        // }
        media!.copyright = info.copyright
        media!.creator = info.creator
        this.mediaService.updateMedia(media!.id!, media!)
      }

      this.previewsChange.emit(this.previews)
      this.markForCheck()
      this.closePictureSettings()
      this.snackBarService.showSuccess(`Bild erfolgreich aktualisiert!`)
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bilddaten:', error)
      this.snackBarService.showError(
        `Fehler beim Aktualisieren der Bilddaten: ${error}`,
      )
    }
  }
}
