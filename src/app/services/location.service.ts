import { inject, Injectable, signal } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Location } from '../models/location.interface'
import { RecordId, StringRecordId } from 'surrealdb'

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly surrealdb: SurrealdbService = inject(SurrealdbService)
  
  // Cache für Locations - verhindert redundante DB-Calls
  private readonly locationCache = new Map<string, Location>()

  //************** GET **************

  async getLocationByID(id: RecordId<'location'> | StringRecordId): Promise<Location> {
    try {
      const idString = String(id)
      
      // Prüfe Cache zuerst
      const cached = this.locationCache.get(idString)
      if (cached) {
        return cached
      }
      
      const result = await this.surrealdb.getByRecordId<Location>(id)
      
      // Speichere im Cache
      this.locationCache.set(idString, result)
      
      return result
    } catch (error) {
      console.error('Fehler in LocationService.getLocationByID:', error)
      throw error
    }
  }

  async getAllLocations(): Promise<Location[]> {
    try {
      const result = await this.surrealdb.getAll<Location>('location')
      return (result || []).map(
        (item: Record<string, unknown>) =>
          ({
            ...item,
          }) as unknown as Location,
      )
    } catch (error) {
      throw new Error(`Fehler beim Laden der Locations: ${error}`)
    }
  }

  //************** POST **************

  async postLocation(location: Location): Promise<Location> {
    const result: Location[] = await this.surrealdb.post<Location>('location', location)
    return result[0]
  }

  /**
   * Aktualisiert eine bestehende Location
   * @param id Die ID der zu aktualisierenden Location
   * @param location Die aktualisierten Daten
   * @returns Promise mit der aktualisierten Location
   */
  async update(id: RecordId<'location'> | StringRecordId, location: Partial<Location>): Promise<Location> {
    try {
      // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
      const updatedLocation = { name: '', ...location } as Location
      return await this.surrealdb.postUpdate<Location>(id, updatedLocation)
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Location mit ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Löscht eine Location
   * @param id Die ID der zu löschenden Location
   * @returns Promise, der anzeigt, ob das Löschen erfolgreich war
   */
  async delete(id: RecordId<'location'> | StringRecordId): Promise<boolean> {
    try {
      await this.surrealdb.deleteRow(id)
      return true
    } catch (error) {
      console.error(`Fehler beim Löschen der Location mit ID ${id}:`, error)
      throw error
    }
  }
}
