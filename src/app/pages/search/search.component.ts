import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { EventCardComponent } from '../../component/event-card/event-card.component'
import { SearchBoxComponent } from '../../component/search-box/search-box.component'
import { SurrealdbService } from '../../services/surrealdb.service'
import { LocationService } from '../../services/location.service'
import { Event as AppEvent } from '../../models/event.interface'
import { Location as AppLocation } from '../../models/location.interface'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'

interface EventWithResolvedLocation extends AppEvent {
  locationName: string
  isPast?: boolean
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, TranslateModule, SearchBoxComponent, EventCardComponent],
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  private readonly surreal = inject(SurrealdbService)
  private readonly locationService = inject(LocationService)
  private readonly markForCheck = injectMarkForCheck()

  loading = false
  results: EventWithResolvedLocation[] = []
  private readonly locationCache = new Map<string, Promise<AppLocation>>()

  async onSearchChange(term: string) {
    const q = (term ?? '').trim()
    console.debug('[SearchComponent] onSearchChange', { q })
    if (!q) {
      this.results = []
      this.markForCheck()
      return
    }

    this.loading = true
    const t0 = performance.now()
    try {
      const events = await this.surreal.fulltextSearchEvents(q)
      console.debug('[SearchComponent] FTS returned', { total: events.length })

      // Resolve locations with cache
      const enriched = await Promise.all(
        events.map(async (event) => {
          let locationData: AppLocation | undefined
          if (event.location) {
            const locationId = String(event.location)
            if (!this.locationCache.has(locationId)) {
              this.locationCache.set(locationId, this.locationService.getLocationByID(event.location))
            }
            locationData = await this.locationCache.get(locationId)
          }
          return {
            ...event,
            locationName: locationData?.name ?? 'Unbekannter Ort',
          } as EventWithResolvedLocation
        }),
      )

      // Mark past and sort upcoming first
      const now = new Date()
      this.results = enriched
        .map((e) => {
          const endDate = e.date_end ? new Date(e.date_end) : new Date(e.date_start)
          return { ...e, isPast: endDate < now }
        })
        .sort((a, b) => {
          if (a.isPast && !b.isPast) return 1
          if (!a.isPast && b.isPast) return -1
          const dateA = new Date(a.date_start).getTime()
          const dateB = new Date(b.date_start).getTime()
          return dateA - dateB
        })

      console.debug('[SearchComponent] search done', { returned: this.results.length, ms: Math.round(performance.now() - t0) })
    } catch (error) {
      console.error('[SearchComponent] search error', error)
    } finally {
      this.loading = false
      this.markForCheck()
    }
  }
}
