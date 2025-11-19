import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { Location } from '../../models/location.interface'
import type { Event } from '../../models/event.interface'
import { LocationService } from '../../services/location.service'
import { EventService } from '../../services/event.service'
import { MatIconModule } from '@angular/material/icon'
import { GeometryPoint, StringRecordId } from 'surrealdb'
import { SnackBarService } from '../../services/snack-bar.service'
import { injectMarkForCheck } from '../../utils/zoneless-helpers'
import { MapComponent } from '../../component/map/map.component'
import { GoBackComponent } from '@app/component/go-back-button/go-back-button.component'
@Component({
  selector: 'app-location-edit',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterModule, MatIconModule, MapComponent, GoBackComponent],
  templateUrl: './location-edit.component.html',
  styleUrl: './location-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly fb = inject(FormBuilder)
  private readonly locationService = inject(LocationService)
  private readonly eventService = inject(EventService)
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
  errorMessage = signal<string | null>(null)
  linkedEventsCount = signal(0)

  // Karten-Koordinaten
  coordinates = signal<[number, number]>([9.1732, 47.7331]) // Default: Radolfzell

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
    this.isLoading.set(true)
    const id = this.route.snapshot.paramMap.get('id')

    if (id && id !== 'create') {
      this.isEditMode.set(true)
      try {
        const locationId = new StringRecordId(id)
        // Prüfen, ob die ID bereits das Präfix "location:" enthält
        this.locationId.set(locationId)
        await this.loadLocation(locationId)
      } catch (error) {
        console.error('Fehler beim Laden des Ortes:', error)
        this.errorMessage.set(this.translate.instant('ADMIN.LOCATIONS.FORM.LOAD_ERROR'))
      }
    } else {
      // Im Erstellungsmodus leeres Formular initialisieren
      this.isEditMode.set(false)
      this.locationId.set(null)
      this.locationForm.reset({
        name: '',
        street: '',
        zip_code: '',
        city: 'Radolfzell',
        geo_point: { type: 'Point', longLat: null },
      })
    }

    this.isLoading.set(false)
  }

  private async loadLocation(id: StringRecordId): Promise<void> {
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

        // Geo-Koordinaten setzen, falls vorhanden
        if (location.geo_point && location.geo_point.coordinates) {
          this.coordinates.set(location.geo_point.coordinates as [number, number])
        }

        await this.updateLinkedEventsCount(id)
      } else {
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
      formData.geo_point = new GeometryPoint(this.coordinates())

      // Bilder hinzufügen
      const locationData: Location = {
        ...formData,
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
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched()

      if ('controls' in control) {
        this.markFormGroupTouched(control as FormGroup)
      }
    })
  }

  // Karten-Funktionen
  updateCoordinates(newCoordinates: [number, number]): void {
    this.coordinates.set(newCoordinates)

    // Aktualisiere auch das Formular
    const geoPointControl = this.locationForm.get('geo_point')
    if (geoPointControl) {
      geoPointControl.patchValue({
        type: 'Point',
        longLat: newCoordinates,
      })
    }

    // Markiere das Formular als "berührt", damit Validierungen ausgelöst werden
    this.markForCheck()
  }

  // Navigation
  cancel(): void {
    this.router.navigate(['/admin/locations'])
  }

  async deleteLocation(): Promise<void> {
    if (!this.isEditMode() || !this.locationId()) return

    if (this.linkedEventsCount() > 0) {
      alert('Ort kann nicht gelöscht werden, solange Events zugeordnet sind.')
      return
    }

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

  private async updateLinkedEventsCount(locationId: StringRecordId): Promise<void> {
    try {
      const events = await this.eventService.getAllEvents()
      const count = this.countEventsForLocation(events ?? [], locationId)
      this.linkedEventsCount.set(count)
    } catch (error) {
      console.error('Fehler beim Prüfen der Event-Zuordnungen:', error)
      this.linkedEventsCount.set(0)
    }
  }

  private countEventsForLocation(events: Event[], locationId: StringRecordId): number {
    return events.reduce((acc, event) => {
      if (!event.location) {
        return acc
      }
      return String(event.location) === String(locationId) ? acc + 1 : acc
    }, 0)
  }
}
