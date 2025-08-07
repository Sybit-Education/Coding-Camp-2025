import { inject, Injectable } from '@angular/core'
import { SurrealdbService } from './surrealdb.service'
import { Organizer } from '../models/organizer.interface'

@Injectable({
  providedIn: 'root',
})
export class OrganizerService {
  private surrealdb: SurrealdbService = inject(SurrealdbService)

  //************** GET **************

  async getOrganizerByID(id: string): Promise<Organizer> {
    return await this.surrealdb.getById<Organizer>(id)
  }

  async getAllOrganizers(): Promise<Organizer[]> {
    try {
      const result = await this.surrealdb.getAll<Organizer>('organizer')
      return (result || []).map(
        (item: Record<string, unknown>) =>
          ({
            ...item
          }) as unknown as Organizer,
      )
    } catch (error) {
      throw new Error(`Fehler beim Laden der Organizer: ${error}`)
    }
  }

  //************** POST **************

  async postOrganizer(organizer: Organizer): Promise<Organizer> {
    const result: Organizer[] = await this.surrealdb.post<Organizer>(
      'organizer',
      organizer,
    )
    return result[0]
  }
}
