import { Component, EventEmitter, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { Media } from '../../models/media.interface'

@Component({
  selector: 'app-upload-image',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './upload-image.component.html',
  styleUrl: './upload-image.component.scss',
})
export class UploadImageComponent {
  @Output() imagesUploaded = new EventEmitter<Media[]>()
  
  isDragging = false
  
  onDragOver(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragging = true
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragging = false
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragging = false
    
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files)
    }
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files) {
      this.handleFiles(input.files)
    }
  }
  
  private handleFiles(files: FileList): void {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (imageFiles.length === 0) return
    
    const uploadedImages: Media[] = []
    
    imageFiles.forEach(file => {
      const reader = new FileReader()
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const media: Media = {
            file: e.target.result as string,
            fileName: file.name,
            fileType: file.type
          }
          
          uploadedImages.push(media)
          
          // If all files are processed, emit the event
          if (uploadedImages.length === imageFiles.length) {
            this.imagesUploaded.emit(uploadedImages)
          }
        }
      }
      
      reader.readAsDataURL(file)
    })
  }
}
