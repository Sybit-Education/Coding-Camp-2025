import { CommonModule } from '@angular/common'
import { Component, inject, input, signal, computed, effect, output, ChangeDetectionStrategy } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ScreenSize } from '@app/models/screenSize.enum'

import { SharedStateService } from '@app/services/shared-state.service'
import { TranslateModule } from '@ngx-translate/core'
import { EventCardComponent } from '../event-card/event-card.component'
import { Event } from '@app/models/event.interface'
import { EventService } from '@app/services/event.service'
import { Location } from '@app/models/location.interface'
import { RecordId } from 'surrealdb'
import { Topic } from '@app/models/topic.interface'
import { TopicService } from '@app/services/topic.service'

@Component({
  selector: 'app-event-card-list',
  imports: [CommonModule, TranslateModule, RouterModule, EventCardComponent],
  templateUrl: './event-card-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardListComponent {
  // Signal-based Inputs
  readonly location = input<Location>()
  readonly currentEventId = input<RecordId<'event'>>()
  readonly limit = input<number>(3)
  readonly highlightEvents = input<boolean>(false)

  // Signal-based Output
  readonly eventsFound = output<boolean>()

  // Services
  readonly sharedStateService = inject(SharedStateService)
  private readonly eventService = inject(EventService)
  private readonly topicService = inject(TopicService)

  // Local state
  protected readonly events = signal<Event[]>([])
  protected readonly topics = signal<Topic[]>([])
  protected readonly error = signal(false)

  // Constants
  protected readonly screenSize = ScreenSize

  // Cache für setUpcomingEvents
  private cachedEvents: {
    input: Event[]
    output: Event[]
    timestamp: number
  } | null = null

  constructor() {
    // Effect to load events when inputs change
    effect(async () => {
      const loc = this.location()
      const currentId = this.currentEventId()

      if (loc && currentId) {
        await this.loadEventsFromLocation(loc, currentId)
      } else if (!loc && !currentId) {
        await this.setUpcomingEvents()
      } else {
        this.error.set(true)
      }
    })
  }

  private async loadEventsFromLocation(location: Location, currentEventId: RecordId<'event'>) {
    const result = await this.eventService.getAllEvents()
    const now = Date.now()

    const filteredEvents = result
      .filter((event) => event.location?.id == location.id?.id)
      .filter((e) => new Date(e.date_start).getTime() > now)
      .filter((e) => e.id?.id !== currentEventId.id)
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      .slice(0, this.limit())

    this.events.set(filteredEvents)
    this.eventsFound.emit(filteredEvents.length > 0)
  }

  private async setUpcomingEvents() {
    const events = await this.eventService.getAllEvents()

    // Prüfe, ob wir ein gültiges Cache-Ergebnis haben (nicht älter als 5 Minuten)
    if (this.cachedEvents?.input === events && Date.now() - this.cachedEvents.timestamp < 300000) {
      this.events.set(this.cachedEvents.output.slice(0, this.limit()))
      return
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let result = events
      .filter((event) => {
        const eventStartDate = new Date(event.date_start)
        const eventStartDay = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate())

        if (eventStartDay < today) return false

        if (event.date_end) {
          return new Date(event.date_end) > now
        }

        const endOfStartDay = new Date(eventStartDate)
        endOfStartDay.setHours(23, 59, 59, 999)
        return endOfStartDay > now
      })
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())

    if (this.highlightEvents()) {
      const topics = await this.topicService.getAllTopics()
      this.topics.set(topics)
      const highlightTopic = topics.find((topic) => this.topicService.isTopicHighlight(topic))

      result = result.filter((event) => {
        const highlightId = highlightTopic?.id?.id
        if (!highlightId) return false

        const topicRefs = event.topic ?? []
        return topicRefs.some((topicRef) => {
          const topicRefId = topicRef?.id ?? topicRef
          return topicRefId === highlightId
        })
      })
    }

    this.cachedEvents = {
      input: events,
      output: result,
      timestamp: Date.now(),
    }

    this.events.set(result.slice(0, this.limit()))
  }
}
