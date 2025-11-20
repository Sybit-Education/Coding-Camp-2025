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
import { CustomDropdownComponent } from '@app/component/custom-dropdown/custom-dropdown.component'
import { KategorieCardComponent } from '@app/component/kategorie-card/kategorie-card.component'
import { IconComponent } from '@app/component/icon/icon.component'

interface EventWithResolvedLocation extends AppEvent {
  locationName: string
  isPast?: boolean
}

@Component({
  selector: 'app-kategorie',
  standalone: true,
  imports: [
    TranslateModule,
    EventCardComponent,
    CommonModule,
    GoBackComponent,
    LoadingSpinnerComponent,
    FormsModule,
    CustomDropdownComponent,
    IconComponent,
    KategorieCardComponent,
    FormsModule,
  ],
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

  selectedCategory: Topic | TypeDB | null = null
  categoryIds: RecordIdValue[] = []
  locations: AppLocation[] = []
  selectedLocation: AppLocation | null = null
  selectedLocationIds: RecordIdValue[] = []
  selectedPrices: number[] = []
selectedDateStart: Date | null = null
selectedDateEnd: Date | null = null

  name: string | null = null
  slug: string | null = null
  description: string | null = null
  media: RecordIdValue | null = null

  loading = true
  searchTerm = ''
  searching = true
  filterOpen = false
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

      const categoryId = this.getCategoryIdFromSlug(topics, typeDB)
      if (categoryId) {
        this.categoryIds.push(categoryId)
      }
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

      this.locations = await Promise.all(this.locationCache.values())
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
      const categoryId = this.categoryIds
      const locationId = this.selectedLocationIds
      let baseList = this.allEvents
      if (categoryId.length > 0) {
        baseList = baseList.filter(
          (event) =>
            event.topic?.some((topic) => categoryId.includes(topic.id)) ||
            (event.event_type && categoryId.includes(event.event_type.id)),
        )
      }

      if (locationId.length > 0) {
        baseList = baseList.filter((event) => event.location && locationId.includes(event.location.id))
      }

      if (this.selectedPrices.length > 0) {
        baseList = baseList.filter((event) => {
          const price = event.price as unknown as number ?? 0
          return this.selectedPrices.some((selectedPrice) => {
            if (selectedPrice === 0) {
              return price === 0
            } else if (selectedPrice === 20) {
              return price > 15
            } else {
              const [min, max] = [(selectedPrice - 5), selectedPrice]
              return price > min && price <= max
            }
          })
        })
      }

      if (this.selectedDateStart) {
        baseList = baseList.filter((event) => {
          const eventStartDate = new Date(event.date_start)
          return eventStartDate >= this.selectedDateStart!
        })
      }

      if (this.selectedDateEnd) {
        baseList = baseList.filter((event) => {
          const eventEndDate = event.date_end ? new Date(event.date_end) : new Date(event.date_start)
          return eventEndDate <= this.selectedDateEnd!
        })
      }

      // Suche anwenden
      let resultEvents: AppEvent[]
      if (searchTerm) {
        const searchResults = await this.surreal.fulltextSearchEvents(searchTerm)
        resultEvents = categoryId
          ? searchResults.filter(
              (event) =>
                event.topic?.some((topic) => !categoryId.includes(topic.id)) ||
                (event.event_type && categoryId.includes(event.event_type.id)),
            )
          : searchResults

        resultEvents = locationId ? resultEvents.filter((event) => !locationId.includes(event.location!.id)) : resultEvents
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

  toggleFilter() {
    this.filterOpen = !this.filterOpen
  }

  getCategories(): { id: string; name: string }[] {
    return this.categories.map((cat) => ({
      id: cat.id!.id as string,
      name: cat.name,
    }))
  }

  getLocations(): { id: string; name: string }[] {
    return this.locations.map((loc) => ({
      id: loc.id!.id as string,
      name: loc.name,
    }))
  }

  getPrices(): { id: string; name: string }[] {
    return [
      { id: '0', name: this.translate.instant('all-categories.eventprices.free') },
      { id: '0-5', name: this.translate.instant('all-categories.eventprices.firststage') },
      { id: '5-10', name: this.translate.instant('all-categories.eventprices.secondstage') },
      { id: '10-15', name: this.translate.instant('all-categories.eventprices.thirdstage') },
      { id: '15+', name: this.translate.instant('all-categories.eventprices.fourthstage') },
    ]
  }

  setSelectedCategories(category: { id: string; name: string }) {
    if (this.categoryIds.includes(category.id as RecordIdValue)) {
      this.categoryIds = this.categoryIds.filter((id) => id !== category.id)
    } else {
      this.categoryIds.push(category.id as RecordIdValue)
    }
    void this.performSearch(this.searchTerm)
  }

  setSelectedLocations(location: { id: string; name: string }[]) {
    this.selectedLocationIds = location.map((loc) => loc.id as RecordIdValue)
    void this.performSearch(this.searchTerm)
  }

  setSelectedPrices(prices: { id: string; name: string }[]) {
    this.selectedPrices = prices.map((price) => {
      const id = price.id
      if (id === '0') return 0
      if (id === '0-5') return 5
      if (id === '5-10') return 10
      if (id === '10-15') return 15
      if (id === '15+') return 20
      return 0
    })
    console.log('Selected prices:', this.selectedPrices)
    void this.performSearch(this.searchTerm)
  }

  setSelectedDateStart(date: Date | null) {
    this.selectedDateStart = date
    void this.performSearch(this.searchTerm)
  }

  setSelectedDateEnd(date: Date | null) {
    this.selectedDateEnd = date
    void this.performSearch(this.searchTerm)
  }
}
