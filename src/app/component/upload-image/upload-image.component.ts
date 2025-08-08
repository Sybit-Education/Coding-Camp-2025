import { CommonModule } from '@angular/common'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
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
  media = false
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
    const base64 = (await this.fileToBase64(file)).split(',')[1]

    console.log('fileName: ', base64.split(';')[0].split('/')[1])

    const media: Media = {
      fileName: file.name,
      fileType: file.type,
      file: base64,
    }

    this.pic = media
    console.log('media from child: ', media)

    this.image.emit(this.pic)

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
