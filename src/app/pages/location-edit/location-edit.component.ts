import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Location } from '../../models/location.interface'
import { LocationService } from '../../services/location.service'
import { Media } from '../../models/media.interface'
import { MatIconModule } from '@angular/material/icon'
import { RecordId } from 'surrealdb'
import { UploadImageComponent } from '../../component/upload-image/upload-image.component'

@Component({
  selector: 'app-location-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterModule,
    UploadImageComponent,
    MatIconModule,
  ],
  templateUrl: './location-edit.component.html',
  styleUrl: './location-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly fb = inject(FormBuilder)
  private readonly locationService = inject(LocationService)

  locationForm!: FormGroup
  isLoading = signal(true)
  isSubmitting = signal(false)
  isEditMode = signal(false)
  locationId = signal<RecordId<'location'> | null>(null)
  uploadedImages = signal<Media[]>([])
  errorMessage = signal<string | null>(null)

  ngOnInit(): void {
    this.initForm()
    this.checkRouteParams()
  }

  private initForm(): void {
    this.locationForm = this.fb.group({
      name: ['', [Validators.required]],
      street: [''],
      zip_code: [''],
      city: ['Radolfzell'],
      geo_point: this.fb.group({
        type: ['Point'],
        longLat: [null],
      }),
    })
  }

  private async checkRouteParams(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')
    
    if (id && id !== 'create') {
      this.isEditMode.set(true)
      try {
        const locationId = `location:${id}` as unknown as RecordId<'location'>
        this.locationId.set(locationId)
        await this.loadLocation(locationId)
      } catch (error) {
        console.error('Fehler beim Laden des Ortes:', error)
        this.errorMessage.set('Der Ort konnte nicht geladen werden.')
      }
    }
    
    this.isLoading.set(false)
  }

  private async loadLocation(id: RecordId<'location'>): Promise<void> {
    try {
      const location = await this.locationService.getLocationByID(id)
      
      if (location) {
        // Formular mit den Daten des Ortes befüllen
        this.locationForm.patchValue({
          name: location.name,
          street: location.street || '',
          zip_code: location.zip_code || '',
          city: location.city || 'Radolfzell',
          geo_point: location.geo_point || { type: 'Point', longLat: null },
        })
        
        // Bilder laden, falls vorhanden
        if (location.media && Array.isArray(location.media)) {
          this.uploadedImages.set(location.media)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Ortes:', error)
      throw error
    }
  }

  async onSubmit(): Promise<void> {
    if (this.locationForm.invalid) {
      this.markFormGroupTouched(this.locationForm)
      return
    }

    this.isSubmitting.set(true)
    this.errorMessage.set(null)

    try {
      const formData = this.locationForm.value
      
      // Bilder hinzufügen
      const locationData: Location = {
        ...formData,
        media: this.uploadedImages(),
      }

      if (this.isEditMode() && this.locationId()) {
        // Ort aktualisieren
        await this.locationService.update(this.locationId()!, locationData)
      } else {
        // Neuen Ort erstellen
        await this.locationService.postLocation(locationData)
      }

      // Zurück zur Übersicht navigieren
      this.router.navigate(['/admin/locations'])
    } catch (error) {
      console.error('Fehler beim Speichern des Ortes:', error)
      this.errorMessage.set('Der Ort konnte nicht gespeichert werden.')
    } finally {
      this.isSubmitting.set(false)
    }
  }

  // Hilfsfunktion, um alle Formularfelder als berührt zu markieren
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched()
      
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup)
      }
    })
  }

  // Bilder-Handling
  onImagesUploaded(images: Media[]): void {
    // Neue Bilder zu vorhandenen hinzufügen
    const currentImages = this.uploadedImages()
    this.uploadedImages.set([...currentImages, ...images])
  }

  removeImage(index: number): void {
    const images = [...this.uploadedImages()]
    images.splice(index, 1)
    this.uploadedImages.set(images)
  }

  // Navigation
  cancel(): void {
    this.router.navigate(['/admin/locations'])
  }

  async deleteLocation(): Promise<void> {
    if (!this.isEditMode() || !this.locationId()) return

    if (confirm('Möchten Sie diesen Ort wirklich löschen?')) {
      try {
        await this.locationService.delete(this.locationId()!)
        this.router.navigate(['/admin/locations'])
      } catch (error) {
        console.error('Fehler beim Löschen des Ortes:', error)
        this.errorMessage.set('Der Ort konnte nicht gelöscht werden.')
      }
    }
  }
}
