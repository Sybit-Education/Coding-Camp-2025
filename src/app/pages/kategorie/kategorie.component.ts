import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core'
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
  events: EventWithResolvedLocation[] = []

  topics: Topic[] = []
  id: RecordIdValue | null = null
  name: string | null = null
  loading = true

  private readonly route = inject(ActivatedRoute)
  private readonly markForCheck = injectMarkForCheck()
  fromCategory = ''

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.id = params['id'] as RecordIdValue | null

      this.name = params['name'] || null

      // Daten neu laden, wenn sich die Parameter ändern
      this.initilizeData().then(() => this.markForCheck())

      this.fromCategory =
        (this.id?.toString() || 'keineID') + ',' + (this.name || 'keinName')
    })
  }
  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly topicService: TopicService = inject(TopicService)

  // Cache für Locations, um wiederholte Anfragen zu vermeiden
  private readonly locationCache = new Map<string, Promise<AppLocation>>()

  async initilizeData() {
    this.loading = true
    try {
      // Lade Topics und Events parallel
      const [topics, allEvents] = await Promise.all([
        this.topicService.getAllTopics(),
        this.eventService.getAllEvents(),
      ])

      this.topics = topics

      // Filtere Events basierend auf der ID
      const rawEvents = !this.id
        ? allEvents
        : allEvents.filter(
            (event) =>
              event.topic?.some((topic) => topic.id === this.id) ||
              event.event_type?.id === this.id,
          )

      // Optimiere Location-Ladung durch Caching
      this.events = await Promise.all(
        rawEvents.map(async (event) => {
          // Verwende Cache für Locations
          let locationData: AppLocation | undefined

          if (event.location) {
            const locationId = String(event.location)
            if (!this.locationCache.has(locationId)) {
              this.locationCache.set(
                locationId,
                this.locationService.getLocationByID(event.location),
              )
            }

            locationData = await this.locationCache.get(locationId)
          }
          return {
            ...event,
            locationName: locationData?.name ?? 'Unbekannter Ort',
          }
        }),
      )

      // Markiere vergangene Events und sortiere nach Datum (aufsteigend)
      const now = new Date()
      this.events = this.events.map((event) => {
        const endDate = event.date_end
          ? new Date(event.date_end)
          : new Date(event.date_start)
        return {
          ...event,
          isPast: endDate < now,
        }
      })

      // Sortiere Events: Aktuelle Events nach Datum (aufsteigend), vergangene Events ans Ende
      this.events.sort((a, b) => {
        // Wenn ein Event vergangen ist und das andere nicht, kommt das aktuelle zuerst
        if (a.isPast && !b.isPast) return 1
        if (!a.isPast && b.isPast) return -1

        // Wenn beide Events den gleichen Status haben (beide vergangen oder beide aktuell),
        // sortiere nach Datum aufsteigend
        const dateA = new Date(a.date_start).getTime()
        const dateB = new Date(b.date_start).getTime()
        return dateA - dateB
      })

      console.log('Kategorie-Events geladen:', this.events.length)
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error)
    } finally {
      this.loading = false
      // Change Detection auslösen, da wir OnPush verwenden
      this.markForCheck()
    }
  }
}
