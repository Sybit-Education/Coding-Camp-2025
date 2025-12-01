import { Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { Location } from '../../models/location.interface'
import { LocationService } from '../../services/location.service'
import { SnackBarService } from '../../services/snack-bar.service'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { GeometryPoint } from 'surrealdb'
import { MapComponent } from '../map/map.component'

@Component({
  selector: 'app-location-input',
  imports: [CommonModule, FormsModule, TranslateModule, MapComponent],
  templateUrl: './location-input.component.html',
  styleUrls: ['./location-input.component.scss'],
})
export class LocationInputComponent {
  @Input() locations: Location[] = []
  @Input() selectedLocation: Location | null = null
  @Input() errorLocation = false
  @Output() locationSelected = new EventEmitter<Location | null>()

  // Form fields
  locationName = ''
  address = ''
  plz = ''
  city = ''
  newLocation = false
  latlng: GeometryPoint | undefined

  // Services
  private readonly locationService = inject(LocationService)
  private readonly snackBarService = inject(SnackBarService)
  private readonly markForCheck = injectMarkForCheck()

  /**
   * Setzt die ausgewählte Location und aktualisiert die Formularfelder
   */
  setLocation(location: Location | null) {
    this.selectedLocation = location
    if (location) {
      this.locationName = location.name
      this.address = location.street ?? ''
      this.plz = location.zip_code ?? ''
      this.city = location.city ?? ''
    }
    this.locationSelected.emit(location)
  }

  /**
   * Zeigt das Formular zum Erstellen einer neuen Location an
   */
  showNewLocationForm() {
    this.newLocation = true
    this.locationName = ''
    this.address = ''
    this.plz = ''
    this.city = ''
    this.selectedLocation = null
    this.locationSelected.emit(null)
  }

  /**
   * Bricht die Erstellung einer neuen Location ab
   */
  cancelNewLocation() {
    this.newLocation = false
  }

  /**
   * Speichert eine neue Location
   */
  async saveLocation() {
    if (!this.locationName) {
      this.snackBarService.showError('Bitte einen Namen für die Location eingeben!')
      return
    }

    const location: Location = {
      name: this.locationName,
      street: this.address || undefined,
      zip_code: this.plz.toString() || undefined,
      city: this.city || 'Radolfzell',
      geo_point: this.latlng || undefined,
    }

    try {
      const savedLocation = await this.locationService.postLocation(location)
      this.selectedLocation = savedLocation
      this.newLocation = false // Formular schließen
      this.snackBarService.showSuccess('Location erfolgreich gespeichert')
      this.locationSelected.emit(savedLocation)

      // Füge die neue Location zur Liste hinzu, wenn sie noch nicht enthalten ist
      if (!this.locations.some((loc) => loc.id?.id === savedLocation.id?.id)) {
        this.locations.push(savedLocation)
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Location:', error)
      this.snackBarService.showError(
        `Fehler beim Speichern der Location: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      )
      this.markForCheck()
    }
  }

  onLocationSelected($event: [number, number]) {
    this.latlng = new GeometryPoint($event)
  }
}
