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
  FormsModule,
} from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Location } from '../../models/location.interface'
import { LocationService } from '../../services/location.service'
import { Media } from '../../models/media.interface'
import { MatIconModule } from '@angular/material/icon'
import { StringRecordId } from 'surrealdb'
import { UploadImageComponent } from '../../component/upload-image/upload-image.component'
import { SnackBarService } from '../../services/snack-bar.service'
import { injectMarkForCheck } from '../../utils/zoneless-helpers'

@Component({
  selector: 'app-location-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
  private readonly translate = inject(TranslateService)
  private readonly snackBarService = inject(SnackBarService)
  private readonly markForCheck = injectMarkForCheck()

  // Reactive Form
  locationForm!: FormGroup
  
  // Template-driven Form Felder (für einfache Bearbeitung)
  locationName = ''
  street = ''
  zipCode = ''
  city = 'Radolfzell'
  
  // UI-Status
  isLoading = signal(true)
  isSubmitting = signal(false)
  isEditMode = signal(false)
  showSimpleForm = signal(false)
  locationId = signal<StringRecordId | null>(null)
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
    
    // Template-driven Form Felder initialisieren
    this.locationName = ''
    this.street = ''
    this.zipCode = ''
    this.city = 'Radolfzell'
  }

  private async checkRouteParams(): Promise<void> {
    this.isLoading.set(true);
    const id = this.route.snapshot.paramMap.get('id')

    if (id && id !== 'create') {
      this.isEditMode.set(true)
      try {
        console.log('Lade Location mit ID:', id);
        const locationId = new StringRecordId(id)
        // Prüfen, ob die ID bereits das Präfix "location:" enthält
        this.locationId.set(locationId);
        await this.loadLocation(locationId);
      } catch (error) {
        console.error('Fehler beim Laden des Ortes:', error)
        this.errorMessage.set(this.translate.instant('ADMIN.LOCATIONS.FORM.LOAD_ERROR'))
      }
    } else {
      // Im Erstellungsmodus leeres Formular initialisieren
      this.isEditMode.set(false)
      this.locationId.set(null)
      this.uploadedImages.set([])
      this.locationForm.reset({
        name: '',
        street: '',
        zip_code: '',
        city: 'Radolfzell',
        geo_point: { type: 'Point', longLat: null }
      })
    }

    this.isLoading.set(false)
  }

  private async loadLocation(id: StringRecordId): Promise<void> {
    try {
      console.log('Rufe getLocationByID auf mit ID:', id);
      const location = await this.locationService.getLocationByID(id)

      if (location) {
        console.log('Geladene Location:', location);

        // Formular mit den Daten des Ortes befüllen
        this.locationForm.patchValue({
          name: location.name,
          street: location.street || '',
          zip_code: location.zip_code || '',
          city: location.city || 'Radolfzell',
          geo_point: location.geo_point || { type: 'Point', longLat: null },
        })
        
        // Template-driven Form Felder befüllen
        this.locationName = location.name
        this.street = location.street || ''
        this.zipCode = location.zip_code || ''
        this.city = location.city || 'Radolfzell'

        // Bilder laden, falls vorhanden
        if (location.media && Array.isArray(location.media)) {
          this.uploadedImages.set(location.media)
        } else {
          this.uploadedImages.set([])
        }
      } else {
        console.error('Location nicht gefunden oder undefiniert');
        this.errorMessage.set(this.translate.instant('ADMIN.LOCATIONS.FORM.LOAD_ERROR'))
      }
    } catch (error) {
      console.error('Fehler beim Laden des Ortes:', error)
      throw error
    }
  }

  async onSubmit(): Promise<void> {
    // Prüfen, welches Formular verwendet wird
    if (this.showSimpleForm()) {
      return this.saveSimpleForm();
    }
    
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
        this.snackBarService.showSuccess('Ort erfolgreich aktualisiert')
      } else {
        // Neuen Ort erstellen
        await this.locationService.postLocation(locationData)
        this.snackBarService.showSuccess('Ort erfolgreich erstellt')
      }

      // Zurück zur Übersicht navigieren
      this.router.navigate(['/admin/locations'])
    } catch (error) {
      console.error('Fehler beim Speichern des Ortes:', error)
      this.errorMessage.set(this.translate.instant('ADMIN.LOCATIONS.FORM.SAVE_ERROR'))
    } finally {
      this.isSubmitting.set(false)
    }
  }
  
  /**
   * Speichert das einfache Formular (Template-driven)
   */
  async saveSimpleForm(): Promise<void> {
    if (!this.locationName) {
      this.snackBarService.showError('Bitte einen Namen für den Ort eingeben!')
      return
    }

    this.isSubmitting.set(true)
    this.errorMessage.set(null)

    const location: Location = {
      name: this.locationName,
      street: this.street || undefined,
      zip_code: this.zipCode || undefined,
      city: this.city || 'Radolfzell',
      media: this.uploadedImages(),
    }

    try {
      console.log('Speichere Ort:', location)
      
      if (this.isEditMode() && this.locationId()) {
        // Ort aktualisieren
        await this.locationService.update(this.locationId()!, location)
        this.snackBarService.showSuccess('Ort erfolgreich aktualisiert')
      } else {
        // Neuen Ort erstellen
        await this.locationService.postLocation(location)
        this.snackBarService.showSuccess('Ort erfolgreich erstellt')
      }
      
      // Zurück zur Übersicht navigieren
      this.router.navigate(['/admin/locations'])
    } catch (error) {
      console.error('Fehler beim Speichern des Ortes:', error)
      this.snackBarService.showError(
        `Fehler beim Speichern des Ortes: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      )
      this.markForCheck()
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

  // UI-Steuerung
  toggleFormType(): void {
    this.showSimpleForm.update(value => !value)
  }
  
  // Navigation
  cancel(): void {
    this.router.navigate(['/admin/locations'])
  }

  async deleteLocation(): Promise<void> {
    if (!this.isEditMode() || !this.locationId()) return

    if (confirm(this.translate.instant('ADMIN.LOCATIONS.FORM.DELETE_CONFIRM'))) {
      try {
        await this.locationService.delete(this.locationId()!)
        this.router.navigate(['/admin/locations'])
      } catch (error) {
        console.error('Fehler beim Löschen des Ortes:', error)
        this.errorMessage.set(this.translate.instant('ADMIN.LOCATIONS.FORM.DELETE_ERROR'))
      }
    }
  }
}
