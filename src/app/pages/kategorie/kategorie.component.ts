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
import { FilterItem } from '@app/models/filterItem.interface'
import { SearchComponent } from '@app/component/search/search.component'

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
    SearchComponent,
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

  locationsForFilter: FilterItem[] = []
  preselectedLocations: FilterItem[] = [] //Nur für vorselektierte Locations
  pricesForFilter: FilterItem[] = []
  preselectedPrices: FilterItem[] = [] //Nur für vorselektierte Preise
  filterQuery: string | null = null

  loading = true
  searchTerm = ''
  searching = true
  filterOpen = false
  private allEvents: AppEvent[] = []
  private searchDebounce: number | null = null
  private receivedFilters: URLSearchParams | null = null

  // Cache für Locations, um wiederholte Anfragen zu vermeiden
  readonly locationCache = new Map<string, Promise<AppLocation>>()

  // --------------------------------- Initialization ---------------------------------
  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug')
    })
    this.route.queryParamMap.subscribe((params) => {
      const filterQueryParam = params.get('filterQuery')
      if (filterQueryParam) {
        console.log('Found filterQuery param:', filterQueryParam)
        this.receivedFilters = new URLSearchParams(decodeURIComponent(filterQueryParam))
      }
    })
    this.initilizeData().then(() => this.markForCheck())
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

      this.locationsForFilter = this.getLocations()

      if (this.receivedFilters) {
        this.resolveFilterQuery(this.receivedFilters)
      }
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

  // --------------------------------- Search & Filtering ---------------------------------
  onSearchChange(term: string) {
    console.log('Received search term:', term)
    this.searchTerm = (term ?? '').trim()
    if (this.searchDebounce) {
      window.clearTimeout(this.searchDebounce)
    }

    this.searchDebounce = window.setTimeout(() => {
      void this.performSearch(this.searchTerm)
    }, 300)
  }

  /**
   * Performs the search and filtering of events based on the search term and selected filters.
   * @param searchTerm The term to search for.
   */
  private async performSearch(searchTerm: string) {
    this.searching = true
    // Sofort rendern, damit der Spinner zuverlässig sichtbar ist
    this.markForCheck()

    this.buildFilterQuery()

    try {
      let candidateEvents: AppEvent[]

      if (searchTerm.length > 1) {
        // Get search results from the fulltext index and apply the same base filters
        const searchResults = await this.surreal.fulltextSearchEvents(searchTerm)
        candidateEvents = this.applyBaseFilters(searchResults)
      } else {
        // Use the in-memory list (allEvents) and apply base filters
        candidateEvents = this.applyBaseFilters(this.allEvents)
      }

      const mapped = await this.mapEventsWithLocation(candidateEvents)
      this.events = mapped
    } catch (error) {
      console.error('[EventSearcher] performSearch:error', error)
      this.events = []
    } finally {
      this.searching = false
      this.markForCheck()
    }
  }

  /**
   * Applies the base filters (category, location, price, date range) to the given events.
   * @param events The events to filter.
   * @returns The filtered events.
   */
  private applyBaseFilters(events: AppEvent[]): AppEvent[] {
    let out = events
    out = this.filterByCategory(out, this.categoryIds)
    out = this.filterByLocation(out, this.selectedLocationIds)
    return out
  }

  // ------- Filter functions -------
  /**
   * Filters events by the given category IDs.
   * @param events The events to filter.
   * @param categoryIds The category IDs to filter by.
   * @returns The filtered events.
   */
  private filterByCategory(events: AppEvent[], categoryIds: RecordIdValue[]): AppEvent[] {
    if (!categoryIds || categoryIds.length === 0) return events

    return events.filter((event) => {
      // Alle Category-IDs müssen abgedeckt sein
      const eventCategoryIds = [...(event.topic?.map((t) => t.id) ?? []), event.event_type?.id].filter(Boolean) as RecordIdValue[]

      return categoryIds.every((id) => eventCategoryIds.includes(id))
    })
  }

  /**
   * Filters events by the given location IDs.
   * @param events The events to filter.
   * @param locationIds The location IDs to filter by.
   * @returns The filtered events.
   */
  private filterByLocation(events: AppEvent[], locationIds: RecordIdValue[]): AppEvent[] {
    if (!locationIds || locationIds.length === 0) return events

    return events.filter((event) => {
      if (!event.location) return false

      const id = event.location.id
      return locationIds.includes(id)
    })
  }

  // -------------------------------- Event Location Resolution ---------------------------------
  private async resolveLocationForEvent(event: AppEvent): Promise<AppLocation | undefined> {
    if (!event.location) return undefined
    const id = event.location.id.toString()
    if (!this.locationCache.has(id)) {
      // store promise so concurrent lookups don't trigger multiple network calls
      this.locationCache.set(id, this.locationService.getLocationByID(event.location))
    }
    return this.locationCache.get(id)
  }

  private async mapEventsWithLocation(events: AppEvent[]): Promise<EventWithResolvedLocation[]> {
    const now = new Date()
    const mapped = await Promise.all(
      events.map(async (event) => {
        const location = await this.resolveLocationForEvent(event)
        const endDate = event.date_end ? new Date(event.date_end) : new Date(event.date_start)
        return {
          ...event,
          locationName: location?.name ?? 'Unbekannter Ort',
          isPast: endDate < now,
        } as EventWithResolvedLocation
      }),
    )

    mapped.sort((a, b) => {
      if (a.isPast && !b.isPast) return 1
      if (!a.isPast && b.isPast) return -1
      return new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    })

    return mapped
  }

  // --------------------------------- UI Tracking Handlers ---------------------------------
  trackByEvent(index: number, item: EventWithResolvedLocation) {
    return item.id?.id ?? index
  }

  toggleFilter() {
    this.filterOpen = !this.filterOpen
  }

  getLocations(): { id: string; name: string }[] {
    return this.locations.map((loc) => ({
      id: loc.id!.id as string,
      name: loc.name,
    }))
  }

  // --------------------------------- UI Selection Handlers ---------------------------------
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

  // --------------------------------- Filter Query ---------------------------------
  private async buildFilterQuery() {
    const params: Record<string, string> = {}

    if (this.searchTerm) {
      params['search'] = this.searchTerm
    }
    if (this.categoryIds.length > 0) {
      params['categories'] = this.categoryIds.map((id) => id.toString()).join(',')
    }
    if (this.selectedLocationIds.length > 0) {
      params['locations'] = this.selectedLocationIds.map((id) => id.toString()).join(',')
    }

    const queryString = new URLSearchParams(params).toString()
    this.filterQuery = queryString ? `${queryString}` : null
  }

  private resolveFilterQuery(queryParams: URLSearchParams) {
    this.filterOpen = true
    const search = queryParams.get('search')
    if (search) {
      this.searchTerm = search
    }

    const categories = queryParams.get('categories')
    if (categories) {
      this.categoryIds = categories.split(',').map((id) => id as RecordIdValue)
      console.log('Resolved category IDs from filter query:', this.categoryIds)
    }

    const locations = queryParams.get('locations')
    if (locations) {
      this.selectedLocationIds = locations.split(',').map((id) => id as RecordIdValue)
      this.preselectedLocations = this.locationsForFilter.filter((loc) =>
        this.selectedLocationIds.includes(loc.id as RecordIdValue),
      )
      console.log('Locations for Filter:', this.locationsForFilter)
      console.log('Selected Locations:', this.selectedLocationIds)
      console.log('preselectedLocations:', this.preselectedLocations)
    }
  }
}
