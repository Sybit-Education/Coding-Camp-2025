import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
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

interface EventWithResolvedLocation extends AppEvent {
  locationName: string
  isPast?: boolean
}

@Component({
  selector: 'app-kategorie',
  standalone: true,
  imports: [TranslateModule, EventCardComponent, CommonModule],
  templateUrl: './kategorie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KategorieComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly markForCheck = injectMarkForCheck()

  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly topicService: TopicService = inject(TopicService)
  private readonly surreal: SurrealdbService = inject(SurrealdbService)

  events: EventWithResolvedLocation[] = []
  topics: Topic[] = []
  eventTypes: TypeDB[] = []
  id: RecordIdValue | null = null
  name: string | null = null
  loading = true
  returnLink = ''
  searchTerm = ''
  private allEvents: AppEvent[] = []
  private searchDebounce: number | null = null

  // Cache für Locations, um wiederholte Anfragen zu vermeiden
  private readonly locationCache = new Map<string, Promise<AppLocation>>()

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.name = params['name'] || null

      // Daten neu laden, wenn sich die Parameter ändern
      this.initilizeData().then(() => this.markForCheck())

      this.returnLink = this.name ? this.name : 'kategorie'
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

      this.topics = topics
      this.eventTypes = typeDB

      this.id = this.getEventIdFromName(topics, typeDB)
      this.allEvents = allEvents

      await this.performSearch(this.searchTerm)
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error)
    } finally {
      this.loading = false
      // Change Detection auslösen, da wir OnPush verwenden
      this.markForCheck()
    }
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

  private async performSearch(q: string) {
    this.loading = true
    try {
      // Basisliste ggf. nach Kategorie einschränken
      const categoryId = this.id
      let baseList = this.allEvents
      if (categoryId) {
        baseList = baseList.filter(
          (event) => event.topic?.some((topic) => topic.id === categoryId) || event.event_type?.id === categoryId,
        )
      }

      let resultEvents: AppEvent[]
      if (q) {
        const searchResults = await this.surreal.fulltextSearchEvents(q)
        resultEvents = categoryId
          ? searchResults.filter(
              (event) => event.topic?.some((topic) => topic.id === categoryId) || event.event_type?.id === categoryId,
            )
          : searchResults
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
      this.loading = false
      this.markForCheck()
    }
  }

  private getEventIdFromName(topics: Topic[], typeDB: TypeDB[]): RecordIdValue | null {
    const topic = topics.find((t) => t.name === this.name)
    const type = typeDB.find((t) => t.name === this.name)

    return topic?.id?.id || type?.id?.id || null
  }
}
