import { Component, inject, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { EventCardComponent } from '../../component/event-card/event-card.component'
import { CommonModule } from '@angular/common'
import { EventService } from '../../services/event.service'
import { LocationService } from '../../services/location.service'
import { TopicService } from '../../services/topic.service'
import { Topic } from '../../models/topic.interface'

import { Event as AppEvent } from '../../models/event.interface'
import { RecordIdValue } from 'surrealdb'

interface EventWithResolvedLocation extends AppEvent {
  locationName: string
}

@Component({
  selector: 'app-kategorie',
  standalone: true,
  imports: [TranslateModule, EventCardComponent, CommonModule],
  templateUrl: './kategorie.component.html',
})
export class KategorieComponent implements OnInit {
  events: EventWithResolvedLocation[] = []

  topics: Topic[] = []
  id: RecordIdValue | null = null
  name: string | null = null

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.id = params['id'] || null
      this.name = params['name'] || null
    })
    this.initilizeData()
  }
  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly topicService: TopicService = inject(TopicService)

  async initilizeData() {
    this.topics = await this.topicService.getAllTopics()
    try {
      let rawEvents: AppEvent[] = []

      if (!this.id) {
        rawEvents = await this.eventService.getAllEvents()
      } else {
        rawEvents = (await this.eventService.getAllEvents()).filter((event) =>
          event.topic?.some((topic) => topic.id === this.id),
        )
      }

      this.events = await Promise.all(
        rawEvents.map(async (event) => {
          const location = await this.locationService.getLocationByID(
            event.location,
          )
          return {
            ...event,
            locationName: location?.name ?? 'Unbekannter Ort',
          }
        }),
      )
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error)
    }
  }
}
