import { Component, input, output, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core'

import { FormsModule } from '@angular/forms'
import { TranslatePipe } from '@ngx-translate/core'
import { Location } from '../../models/location.interface'
import { LocationService } from '../../services/location.service'
import { SnackBarService } from '../../services/snack-bar.service'
import { GeometryPoint } from 'surrealdb'
import { MapComponent } from '../map/map.component'

@Component({
  selector: 'app-location-input',
  imports: [FormsModule, TranslatePipe, MapComponent],
  templateUrl: './location-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./location-input.component.scss'],
})
export class LocationInputComponent {
  readonly locations = input<Location[]>([])
  readonly selectedLocation = input<Location | null>(null)
  readonly errorLocation = input(false)
  readonly locationSelected = output<Location | null>()

  // Lokale, mutable Kopie der Locations-Liste
  protected locationList = signal<Location[]>([])

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

  constructor() {
    // Sync vom Input in die lokale Signal-Liste
    effect(() => {
      this.locationList.set(this.locations())
    })
  }

  /**
   * Setzt die ausgewählte Location und aktualisiert die Formularfelder
   */
  setLocation(location: Location | null) {
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
      this.newLocation = false // Formular schließen
      this.snackBarService.showSuccess('Location erfolgreich gespeichert')
      this.locationSelected.emit(savedLocation)

      // Füge die neue Location zur lokalen Liste hinzu
      this.locationList.update((list) => {
        if (list.some((loc) => loc.id?.id === savedLocation.id?.id)) {
          return list
        }
        return [...list, savedLocation]
      })
    } catch (error) {
      console.error('Fehler beim Speichern der Location:', error)
      this.snackBarService.showError(
        `Fehler beim Speichern der Location: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      )
    }
  }

  onLocationSelected($event: [number, number]) {
    this.latlng = new GeometryPoint($event)
  }
}
