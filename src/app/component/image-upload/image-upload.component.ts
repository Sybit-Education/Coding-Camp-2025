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
import { RecordId } from 'surrealdb'
import { MediaService } from '../../services/media.service'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { Media } from '../../models/media.model'
import { SnackBarService } from '../../services/snack-bar.service'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent implements OnInit, OnChanges {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>
  
  @Input() previews: string[] = []
  @Input() eventName = ''
  @Input() existingImages: RecordId<'media'>[] = []
  
  @Output() previewsChange = new EventEmitter<string[]>()
  @Output() mediaIdsChange = new EventEmitter<RecordId<'media'>[]>()
  
  isDragging = false
  
  private readonly mediaService = inject(MediaService)
  private readonly markForCheck = injectMarkForCheck()
  private readonly snackBarService = inject(SnackBarService)
  
  ngOnInit(): void {
    // Lade existierende Bilder, wenn vorhanden
    this.loadExistingImagesIfPresent();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Wenn sich existingImages ändert und Werte enthält, lade die Bilder
    if (changes['existingImages'] && 
        changes['existingImages'].currentValue && 
        changes['existingImages'].currentValue.length > 0) {
      this.loadExistingImagesIfPresent();
    }
  }
  
  private loadExistingImagesIfPresent(): void {
    if (this.existingImages && this.existingImages.length > 0) {
      // Nur laden, wenn die Vorschau noch leer ist, um Duplikate zu vermeiden
      if (this.previews.length === 0) {
        this.loadExistingImages();
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
        this.snackBarService.showError(`Datei zu groß (max. 5 MB): ${file.name}`)
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
          this.previews.push(reader.result)
          this.previewsChange.emit(this.previews)
          this.markForCheck()
        }
      }
      reader.readAsDataURL(file)
    }
  }
  
  private loadExistingImages() {
    console.log('Lade existierende Bilder:', this.existingImages);
    this.existingImages.forEach((image) => {
      this.mediaService.getMediaUrl(image).then((url) => {
        if (url) {
          // Prüfen, ob das Bild bereits in den Vorschauen vorhanden ist
          if (!this.previews.includes(url)) {
            this.previews.push(url);
            this.previewsChange.emit(this.previews);
            this.markForCheck();
          }
        }
      }).catch(error => {
        console.error('Fehler beim Laden des Bildes:', error);
      });
    });
  }

  removeImage(index: number) {
    this.previews.splice(index, 1)
    this.previewsChange.emit(this.previews)
  }
  
  async uploadImages(): Promise<RecordId<'media'>[]> {
    const result: RecordId<'media'>[] = []
    try {
      const resultMedias: Media[] = (
        await Promise.all(
          this.previews.map(async (image: string, i: number) => {
            try {
              if (image.startsWith('http')) {
                const existingMedia = await this.mediaService.getMediaByUrl(image)
                if (existingMedia) {
                  return existingMedia
                } else {
                  return null
                }
              } else {
                const newMedia: Media = {
                  id: (this.eventName.replace(/[^a-zA-Z0-9]/g, '_') +
                    '_' +
                    i +
                    '_' +
                    image
                      .split(';')[0]
                      .split('/')[1]) as unknown as RecordId<'media'>,
                  file: image.split(',')[1],
                  fileName: this.eventName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + i,
                  fileType: image.split(';')[0].split('/')[1],
                }
                return await this.mediaService.postMedia(newMedia)
              }
            } catch (error) {
              console.error(`Fehler beim Verarbeiten des Bildes ${i}:`, error)
              this.snackBarService.showError(`Fehler beim Hochladen des Bildes ${i+1}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
              this.markForCheck()
              return null
            }
          }),
        )
      ).filter((media): media is Media => media !== null)
      result.push(...resultMedias.map((media) => media.id as RecordId<'media'>))
      this.mediaIdsChange.emit(result)
      return result
    } catch (error) {
      console.error('Fehler beim Hochladen der Bilder:', error)
      this.snackBarService.showError(`Fehler beim Hochladen der Bilder: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
      this.markForCheck()
      return result
    }
  }
}
