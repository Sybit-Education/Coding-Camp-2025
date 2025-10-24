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
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Location } from '../../models/location.interface'
import { LocationService } from '../../services/location.service'
import { Media } from '../../models/media.interface'
import { MatIconModule } from '@angular/material/icon'
import { GeometryPoint, StringRecordId } from 'surrealdb'
import { UploadImageComponent } from '../../component/upload-image/upload-image.component'
import { SnackBarService } from '../../services/snack-bar.service'
import { injectMarkForCheck } from '../../utils/zoneless-helpers'
import { MapComponent } from '../../component/map/map.component'
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
    MapComponent,
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

  // UI-Status
  isLoading = signal(true)
  isSubmitting = signal(false)
  isEditMode = signal(false)
  locationId = signal<StringRecordId | null>(null)
  uploadedImages = signal<Media[]>([])
  errorMessage = signal<string | null>(null)

  // Karten-Koordinaten
  coordinates = signal<[number, number]>([47.7331, 9.1732]) // Default: Radolfzell

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

        // Geo-Koordinaten setzen, falls vorhanden
        if (location.geo_point && location.geo_point.coordinates) {
          this.coordinates.set([location.geo_point.coordinates[1], location.geo_point.coordinates[0]] as [number, number]);
        }

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
    if (this.locationForm.invalid) {
      this.markFormGroupTouched(this.locationForm)
      return
    }

    this.isSubmitting.set(true)
    this.errorMessage.set(null)

    try {
      const formData = this.locationForm.value

      // Aktuelle Koordinaten in das Formular übernehmen
      formData.geo_point = new GeometryPoint([ this.coordinates()[1],  this.coordinates()[0] ]);

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

  // Karten-Funktionen
  updateCoordinates(newCoordinates: [number, number]): void {
    this.coordinates.set(newCoordinates);
    console.log('Neue Koordinaten gesetzt:', newCoordinates);
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
