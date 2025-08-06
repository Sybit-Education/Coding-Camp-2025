import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Location } from '../models/location.interface'

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private surrealdb: SurrealdbService = inject(SurrealdbService)

  //************** GET **************

  async getLocationByID(id: string): Promise<Location> {
    return await this.surrealdb.getById<Location>(id)
  }

  async getAllLocations(): Promise<Location[]> {
    try {
      const result = await this.surrealdb.getAll<Location>('location')
      return (result || []).map(
        (item: Record<string, unknown>) =>
          ({
            ...item,
            id: item['id']?.toString() || '',
          }) as unknown as Location,
      )
    } catch (error) {
      throw new Error(`Fehler beim Laden der Events: ${error}`)
    }
  }

  //************** POST **************

  async postLocation(location: Location): Promise<Location> {
    const result: Location[] = await this.surrealdb.post<Location>(
      'location',
      location,
    )
    return result[0]
  }
}
