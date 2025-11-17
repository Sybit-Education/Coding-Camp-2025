import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { EventCardComponent } from '../../component/event-card/event-card.component'

import { EventService } from '../../services/event.service'
import { LocationService } from '../../services/location.service'
import { TopicService } from '../../services/topic.service'
import { Topic } from '../../models/topic.interface'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'

import { Event as AppEvent } from '../../models/event.interface'
import { Location as AppLocation } from '../../models/location.interface'
import { RecordIdValue } from 'surrealdb'
import { CommonModule } from '@angular/common'
import { TypeDB } from '@app/models/typeDB.interface'
import { SurrealdbService } from '../../services/surrealdb.service'
import { GoBackComponent } from '@app/component/go-back-button/go-back-button.component'
import { LoadingSpinnerComponent } from '@app/component/loading-spinner/loading-spinner.component'
import { FormsModule } from '@angular/forms'

interface EventWithResolvedLocation extends AppEvent {
  locationName: string
  isPast?: boolean
}

@Component({
  selector: 'app-kategorie',
  standalone: true,
  imports: [TranslateModule, EventCardComponent, CommonModule, GoBackComponent, LoadingSpinnerComponent, FormsModule],
  templateUrl: './kategorie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KategorieComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly markForCheck = injectMarkForCheck()

  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly topicService: TopicService = inject(TopicService)
  private readonly surreal: SurrealdbService = inject(SurrealdbService)
  private readonly translate: TranslateService = inject(TranslateService)

  events: EventWithResolvedLocation[] = []
  categories: (Topic | TypeDB)[] = []

  categoryId: RecordIdValue | null = null
  selectedLocationId: RecordIdValue | null = null
  name: string | null = null
  slug: string | null = null
  description: string | null = null
  media: RecordIdValue | null = null

  loading = true
  searchTerm = ''
  searching = false
  private allEvents: AppEvent[] = []
  private searchDebounce: number | null = null

  // Cache für Locations, um wiederholte Anfragen zu vermeiden
  readonly locationCache = new Map<string, Promise<AppLocation>>()

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug')
      // Daten neu laden, wenn sich die Parameter ändern
      this.initilizeData().then(() => this.markForCheck())
    })
  }

  async initilizeData() {
    this.loading = true
    try {
      // Lade Topics und Events parallel
      const [topics, allEvents, typeDB] = await Promise.all([
        this.topicService.getAllTopics(),
        this.eventService.getAllEvents(),
        this.eventService.getAllEventTypes(),
      ])

      this.categories = [...topics, ...typeDB]
      this.allEvents = allEvents

      this.categoryId = this.getCategoryIdFromSlug(topics, typeDB)
      // Anzeigename aus slug auflösen (Thema oder Typ)
      if (this.slug) {
        const matchedTopic = topics.find((t) => t.slug === this.slug)
        const matchedType = typeDB.find((t) => t.slug === this.slug)
        if (!matchedTopic && !matchedType) {
          // 404-Fallback, wenn Slug weder Topic noch Event-Typ entspricht
          this.router.navigate(['/404'])
          return
        }
        this.name = matchedTopic?.name || matchedType?.name || null
        this.description = matchedTopic?.description || matchedType?.description || null
      } else {
        this.name = this.translate.instant('bottom-nav.all-events')
      }

      await this.performSearch(this.searchTerm)
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error)
    } finally {
      this.loading = false
      // Change Detection auslösen, da wir OnPush verwenden
      this.markForCheck()
    }
  }
  private getCategoryIdFromSlug(topics: Topic[], typeDB: TypeDB[]): RecordIdValue | null {
    if (!this.slug) return null
    const topic = topics.find((t) => t.slug === this.slug)
    const type = typeDB.find((t) => t.slug === this.slug)

    return type?.id?.id || topic?.id?.id || null
  }

  onSearchChange(term: string) {
    this.searchTerm = (term ?? '').trim()
    if (this.searchDebounce) {
      window.clearTimeout(this.searchDebounce)
    }

    this.searchDebounce = window.setTimeout(() => {
      void this.performSearch(this.searchTerm)
    }, 300)
  }

  private async performSearch(searchTerm: string) {
    this.searching = true
    // Sofort rendern, damit der Spinner zuverlässig sichtbar ist
    this.markForCheck()
    try {
      // Basisliste ggf. nach Kategorie einschränken
      const categoryId = this.categoryId
      const locationId = this.selectedLocationId
      let baseList = this.allEvents
      if (categoryId) {
        baseList = baseList.filter(
          (event) => event.topic?.some((topic) => topic.id === categoryId) || event.event_type?.id === categoryId,
        )
      }
      if (locationId) {
        baseList = baseList.filter((event) => event.location?.id === locationId)
      }

      let resultEvents: AppEvent[]
      if (searchTerm) {
        const searchResults = await this.surreal.fulltextSearchEvents(searchTerm)
        resultEvents = categoryId
          ? searchResults.filter(
              (event) => event.topic?.some((topic) => topic.id === categoryId) || event.event_type?.id === categoryId,
            )
          : searchResults
          
        resultEvents = locationId
          ? resultEvents.filter((event) => event.location?.id === locationId)
          : resultEvents
      } else {
        resultEvents = baseList
      }

      // Locations auflösen (mit Cache) + isPast markieren
      const mapped = await Promise.all(
        resultEvents.map(async (event) => {
          let locationData: AppLocation | undefined

          if (event.location) {
            const locationId = String(event.location)
            if (!this.locationCache.has(locationId)) {
              this.locationCache.set(locationId, this.locationService.getLocationByID(event.location))
            }
            locationData = await this.locationCache.get(locationId)
          }

          const endDate = event.date_end ? new Date(event.date_end) : new Date(event.date_start)
          return {
            ...event,
            locationName: locationData?.name ?? 'Unbekannter Ort',
            isPast: endDate < new Date(),
          } as EventWithResolvedLocation
        }),
      )

      // Sortierung: aktuelle vor vergangenen, dann nach Startdatum
      mapped.sort((a, b) => {
        if (a.isPast && !b.isPast) return 1
        if (!a.isPast && b.isPast) return -1
        const dateA = new Date(a.date_start).getTime()
        const dateB = new Date(b.date_start).getTime()
        return dateA - dateB
      })

      this.events = mapped
    } catch (error) {
      console.error('[KategorieComponent] performSearch:error', error)
      this.events = []
    } finally {
      this.searching = false
      this.markForCheck()
    }
  }

  trackByEvent(index: number, item: EventWithResolvedLocation) {
    return item.id?.id ?? index
  }
}
