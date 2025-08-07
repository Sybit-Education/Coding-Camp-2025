import { CommonModule } from '@angular/common'
import { Component, inject, Input } from '@angular/core'
import { RecordId } from 'surrealdb'
import { SurrealdbService } from '../../services/surrealdb.service'
import { Media } from '../../models/media.model'
import { MediaService } from '../../services/media.service'

@Component({
  selector: 'app-upload-image',
  imports: [CommonModule],
  templateUrl: './upload-image.component.html',
  styleUrl: './upload-image.component.scss',
})
export class UploadImageComponent {
  @Input() eventName = ''

  private readonly mediaService: MediaService = inject(MediaService)

  isHovering = false
  previewUrl: string | null = null
  previews: string[] = []

  onDragOver(event: DragEvent) {
    event.preventDefault()
    this.isHovering = true
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault()
    this.isHovering = false
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    this.isHovering = false
    const file = event.dataTransfer?.files[0]

    if (file) {
      this.previewImage(file)
      this.saveImage(file)
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      this.previewImage(file)
    }
  }

  previewImage(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      this.previewUrl = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  private async saveImage(file: File) {
    const base64 = await fileToBase64(file)

    const media: Media = {
      id: (this.eventName.replace(/[^a-zA-Z0-9]/g, '_') +
        '_' +
        file.name.split(';')[0].split('/')[1]) as unknown as RecordId<'media'>,

      fileName: file.name,
      fileType: file.type,
      file: base64,
    }

    this.mediaService.postMedia(media)
  }

  private async getImage(): Promise<RecordId<'media'>[]> {
    const result = await Promise.all(
      this.previews.map((image, i) => {
        const newMedia = {
          id: (this.eventName.replace(/[^a-zA-Z0-9]/g, '_') +
            '_' +
            i +
            '_' +
            image.split(';')[0].split('/')[1]) as unknown as RecordId<'media'>,
          file: image.split(',')[1],
          fileName: this.eventName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + i,
          fileType: image.split(';')[0].split('/')[1],
        }
        return this.mediaService.postMedia(newMedia)
      }),
    )

    return result.map((media) => media.id as RecordId<'media'>)
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file) // erzeugt Base64 + MIME-Typ

    reader.onload = () => {
      resolve(reader.result as string) // z. B. data:image/png;base64,iVBORw0KG...
    }

    reader.onerror = (error) => reject(error)
  })
}
