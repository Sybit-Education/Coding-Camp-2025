import { CommonModule } from '@angular/common'
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core'
import { Media } from '../../models/media.model'
import { MediaService } from '../../services/media.service'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-upload-image',
  imports: [CommonModule, TranslateModule],
  templateUrl: './upload-image.component.html',
})
export class UploadImageComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>

  @Input() eventName = ''
  @Output() image = new EventEmitter<Media[]>()

  private readonly mediaService: MediaService = inject(MediaService)

  dragedImage = false
  isHovering = false
  media = false
  files: File[] = []
  previews: string[] = []
  pic: Media[] = []

  onAreaClick() {
    this.fileInput.nativeElement.click()
  }

  onDragOver(event: DragEvent) {
    event.preventDefault()
    this.isHovering = true
  }

  onDragLeave() {
    this.isHovering = false
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    this.isHovering = false
    const file = event.dataTransfer?.files

    if (file) {
      this.handleFiles(Array.from(file))
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) {
      return
    }
    this.handleFiles(Array.from(input.files))
    input.value = ''
  }

  private handleFiles(selected: File[]) {
    for (const file of selected) {
      if (!RegExp(/image\/(png|jpeg)/).exec(file.type)) {
        alert(`Dateityp nicht erlaubt: ${file.name}`)
        continue
      }
      const maxFileSize = 5 * 1024 * 1024
      if (file.size > maxFileSize) {
        alert(`Datei zu groß (max. 5 MB): ${file.name}`)
        continue
      }
      this.files.push(file)
      this.createPreview(file)
    }
  }

  private createPreview(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.previews.push(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  removeImage(index: number) {
    this.files.splice(index, 1)
    this.previews.splice(index, 1)
  }

  private async saveImage(file: File) {
    const base64 = (await this.fileToBase64(file)).split(',')[1]

    const media: Media = {
      fileName: file.name,
      fileType: file.type,
      file: base64,
    }

    this.pic?.push(media)

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
