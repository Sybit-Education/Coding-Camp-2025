import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, afterNextRender, inject, input, signal } from '@angular/core'

import { RecordId, StringRecordId } from 'surrealdb'
import { MediaService } from '../../services/media.service'
import { Media, UploadMedia } from '../../models/media.interface'
import { SnackBarService } from '../../services/snack-bar.service'
import { TranslatePipe } from '@ngx-translate/core'
import { FormsModule } from '@angular/forms'
import imageCompression from 'browser-image-compression'
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component'
import { DragDropModule, moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop'

export interface PictureInfo {
  copyright: string | null
  creator: string | null
}

export interface CombinetPicture {
  pictureInfo: PictureInfo
  previews: string
}

@Component({
  selector: 'app-image-upload',
  imports: [TranslatePipe, FormsModule, LoadingSpinnerComponent, DragDropModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>

  readonly eventName = input('')
  readonly existingImages = input<Media[]>([])

  // Lokaler State (kein Input, da nie vom Parent gesetzt)
  protected previews = signal<string[]>([])

  isDragging = false

  openSettingsIndex: number | null = null
  pictureInfos: PictureInfo[] = []
  deletedImages: Media[] = []

  isUploading = false

  private readonly mediaService = inject(MediaService)
  private readonly snackBarService = inject(SnackBarService)

  constructor() {
    // Lade existierende Bilder nach erstem Render (wenn inputs gesetzt sind)
    afterNextRender(() => {
      this.loadExistingImagesIfPresent()
    })
  }

  private async loadExistingImagesIfPresent(): Promise<void> {
    const existing = this.existingImages()
    if (existing.length === 0) return

    if (this.previews().length === 0) {
      for (const existingImg of existing) {
        try {
          const url = await this.mediaService.getMediaUrl(existingImg.id)
          if (url) {
            this.previews.update((list) => {
              if (list.includes(url)) return list
              return [...list, url]
            })
            this.pictureInfos.push({
              copyright: existingImg.copyright || '',
              creator: existingImg.creator || '',
            })
          }
        } catch (e) {
          console.error('Fehler beim holen media url', e)
        }
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
    this.isUploading = true
    for (const file of selected) {
      if (!RegExp(/image\/(png|jpeg)/).exec(file.type)) {
        this.snackBarService.showError(`Dateityp nicht erlaubt: ${file.name}`)
        continue
      }
      const maxFileSize = 5 * 1024 * 1024
      if (file.size > maxFileSize) {
        this.snackBarService.showError(`Datei zu groß (max. 5 MB): ${file.name}`)
        continue
      }
      this.createPreview(file).finally(() => {
        this.isUploading = false
      })
    }
  }

  private async createPreview(file?: File | null) {
    if (!file) return

    try {
      const options = {
        maxSizeMB: 3.2,
        maxWidthOrHeight: 1920, // skaliert große Bilder etwas runter
        useWebWorker: true,
        initialQuality: 0.8,
        // fileType wird automatisch aus dem erzeugten Blob gesetzt (webp/jpg fallback)
      }

      const compressedBlob = await imageCompression(file, options)

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const dataWithMetadata = {
            dataUrl: reader.result,
            fileName: file.name,
            mimeType: (compressedBlob as Blob).type || file.type,
          }
          this.previews.update((list) => [...list, JSON.stringify(dataWithMetadata)])
          this.pictureInfos.push({ copyright: '', creator: '' })
        }
      }
      reader.readAsDataURL(compressedBlob as Blob)
    } catch (err) {
      console.warn('Bildkompression fehlgeschlagen, Fallback auf original:', err)
      // Fallback
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const dataWithMetadata = {
            dataUrl: reader.result,
            fileName: file.name,
            mimeType: file.type,
          }
          this.previews.update((list) => [...list, JSON.stringify(dataWithMetadata)])
          this.pictureInfos.push({ copyright: '', creator: '' })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  async removeImage(index: number) {
    // Speichere das zu löschende Bild
    const imageToRemove = this.previews()[index]

    // Entferne das Bild aus der Vorschau
    this.previews.update((list) => list.filter((_, i) => i !== index))
    this.pictureInfos.splice(index, 1)

    try {
      // Wenn es ein HTTP-Bild ist (existierendes Bild), finde die Media-ID und merke es zum löschen vor
      if (imageToRemove.startsWith('http')) {
        const existingMedia = await this.mediaService.getMediaByUrl(imageToRemove)
        if (existingMedia?.id) {
          this.deletedImages.push(existingMedia)
        }
      }
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

  idToString(id: unknown): string {
    if (!id && id !== 0) return ''
    if (typeof id === 'string') return id
    try {
      const s = (id as unknown)?.toString?.()
      if (typeof s === 'string' && s.length) return s
      // eslint-disable-next-line no-empty
    } catch {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyId = id as any
    if (anyId?.tb && anyId?.id) return `${anyId.tb}:${anyId.id}`
    if (anyId?.id) return `media:${anyId.id}`
    try {
      return JSON.stringify(id)
    } catch {
      return String(id)
    }
  }

  async uploadImages(): Promise<Media[]> {
    const collected: Media[] = []

    try {
      const currentPreviews = this.previews()
      const currentExisting = this.existingImages()

      // 1) Früher Exit: keine Previews, aber vorhandene Bilder
      if (currentPreviews.length === 0 && currentExisting.length > 0) {
        return [...currentExisting]
      }

      // 2) Existierende Medien aus Preview-URLs einsammeln
      for (const preview of currentPreviews) {
        if (!preview.startsWith('http')) continue

        try {
          const existingViaUrl = await this.mediaService.getMediaByUrl(preview)
          if (existingViaUrl?.id) {
            // Duplikate vermeiden (nach String-ID)
            const existingIdStr = this.idToString(existingViaUrl.id)
            if (!collected.some((m) => this.idToString(m.id) === existingIdStr)) {
              collected.push(existingViaUrl)
            }
            continue
          }

          // Fallback: in existingImages passende URL suchen
          for (const existing of currentExisting) {
            const url = await this.mediaService.getMediaUrl(existing.id)
            if (url === preview) {
              const existingIdStr = this.idToString(existing.id)
              if (!collected.some((media) => this.idToString(media.id) === existingIdStr)) {
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
      const newImageEntries = currentPreviews.map((p, i) => ({ p, i })).filter((e) => !e.p.startsWith('http'))

      for (const { p: raw, i: originalIndex } of newImageEntries) {
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
            originalFileName = `${this.eventName().replace(/[^a-zA-Z0-9]/g, '_')}_${originalIndex}_${Date.now()}`
          }

          const info = this.pictureInfos[originalIndex] ?? {
            copyright: '',
            creator: '',
          }

          // b) generiere id
          const sanitizedEventName = this.eventName().replace(/[^A-Za-z0-9_]/g, '_')

          const safeOriginalFileName = originalFileName.replace(/\.[^/.]+$/, '').replace(/[^A-Za-z0-9_]/g, '_')

          const timestamp = Date.now()

          const uniqueIdStr = `media:${sanitizedEventName}_${safeOriginalFileName}_${timestamp}_${fileType}`

          const uniqueId = uniqueIdStr as unknown as RecordId<'media'>

          // --- c) Media-Objekt für Upload ---
          const mediaToUpload: UploadMedia = {
            id: uniqueId,
            file: `data:image/${fileType};base64,${base64Payload}`,
            fileName: originalFileName,
            fileType: fileType,
            copyright: info.copyright ?? '',
            creator: info.creator ?? '',
          }

          // --- d) Upload → erhält ID (RecordId<'media'> | string)
          const uploadedId = await this.mediaService.postMediaToGoService(mediaToUpload)

          // In String normalisieren
          const uploadedIdStr = this.idToString(uploadedId as unknown as RecordId<'media'> | string)

          // RecordId für getMediaById bauen
          const uploadedRecordId =
            typeof uploadedId === 'string' ? (new StringRecordId(uploadedIdStr) as unknown as RecordId<'media'>) : uploadedId

          // Details laden (falls Service kein vollständiges Media zurückgibt)
          const uploadedMedia = await this.mediaService.getMediaById(uploadedRecordId)

          // Duplikate vermeiden
          if (!collected.some((m) => this.idToString(m.id) === uploadedIdStr)) {
            collected.push(uploadedMedia)
          }
        } catch (error) {
          console.error(`Fehler beim Upload des Bildes #${originalIndex + 1}:`, error)
          this.snackBarService.showError(
            `Fehler beim Hochladen des Bildes ${originalIndex + 1}: ${
              error instanceof Error ? error.message : 'Unbekannter Fehler'
            }`,
          )
        }
      }

      // 4) Einmalig zurückgeben
      return collected
    } catch (error) {
      console.error('Fehler beim Hochladen der Bilder:', error)
      this.snackBarService.showError(
        `Fehler beim Hochladen der Bilder: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      )
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
      const previewData = this.previews()[index]

      if (previewData.startsWith('{') && previewData.endsWith('}')) {
        const parsed = JSON.parse(previewData)
        parsed.copyright = info.copyright || ''
        parsed.creator = info.creator || ''
        this.previews.update((list) => {
          const updated = [...list]
          updated[index] = JSON.stringify(parsed)
          return updated
        })
      } else if (previewData.startsWith('http')) {
        const media = await this.mediaService.getMediaByUrl(previewData)
        media!.copyright = info.copyright ?? ''
        media!.creator = info.creator ?? ''
        this.mediaService.updateMedia(media!.id!, media!)
      }

      this.closePictureSettings()
      this.snackBarService.showSuccess(`Bild erfolgreich aktualisiert!`)
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bilddaten:', error)
      this.snackBarService.showError(`Fehler beim Aktualisieren der Bilddaten: ${error}`)
    }
  }

  dropPreview(event: CdkDragDrop<string[]>) {
    const updated = [...this.previews()]
    const updatedInfos = [...this.pictureInfos]
    moveItemInArray(updated, event.previousIndex, event.currentIndex)
    moveItemInArray(updatedInfos, event.previousIndex, event.currentIndex)
    this.previews.set(updated)
    this.pictureInfos = updatedInfos
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackByFn(index: number, item: any) {
    return item.id
  }
}
