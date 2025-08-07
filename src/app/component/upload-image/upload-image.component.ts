import { CommonModule } from '@angular/common'
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  output,
} from '@angular/core'
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
  @Output() image = new EventEmitter<Media>()

  private readonly mediaService: MediaService = inject(MediaService)

  dragedImage = false
  isHovering = false
  media: boolean = false
  pic?: Media

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
      this.saveImage(file)
    }
  }

  private async saveImage(file: File) {
    const base64 = await this.fileToBase64(file)

    const media: Media = {
      id: (this.eventName.replace(/[^a-zA-Z0-9]/g, '_') +
        '_' +
        file.name.split(';')[0].split('/')[1]) as unknown as RecordId<'media'>,

      fileName: file.name,
      fileType: file.type,
      file: base64,
    }

    this.pic = media

    //this.mediaService.postMedia(media)

    this.dragedImage = true
  }

  fileToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        resolve(reader.result as string)
      }

      reader.onerror = (error) => reject(error)
    })
  }
}
