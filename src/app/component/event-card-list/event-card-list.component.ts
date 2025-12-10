import { CommonModule } from '@angular/common'
import { Component, inject, Input, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core'
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
})
export class EventCardListComponent implements OnInit {
  @Input() location?: Location
  @Input() currentEventId?: RecordId<'event'>
  @Input() limit?: number = 3
  @Input() highlightEvents = false

  @Output() eventsFound = new EventEmitter<boolean>(false)

  events: Event[] = []
  topics: Topic[] = []
  error = false

  readonly sharedStateService = inject(SharedStateService)
  readonly eventService = inject(EventService)
  private readonly cdRef = inject(ChangeDetectorRef)
  private readonly topicService = inject(TopicService)

  screenSize = ScreenSize

  ngOnInit(): void {
    if (this.location && this.currentEventId) {
      this.loadEventsFromLocation()
    } else if (!this.location && !this.currentEventId) {
      this.setUpcomingEvents()
    } else {
      this.error = true
    }
    this.cdRef.markForCheck()
  }

  private async loadEventsFromLocation() {
    const result = await this.eventService.getAllEvents()
    const now = Date.now()

    this.events = result
      .filter((event) => event.location?.id == this.location?.id?.id)
      .filter((e) => new Date(e.date_start).getTime() > now)
      .filter((e) => e.id?.id !== this.currentEventId!.id)
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      .slice(0, this.limit)

    this.eventsFound.emit(this.events.length > 0)

    this.cdRef.markForCheck()
  }

  private cachedEvents: {
    input: Event[]
    output: Event[]
    timestamp: number
  } | null = null

  private async setUpcomingEvents() {
    const events = await this.eventService.getAllEvents()

    // Prüfe, ob wir ein gültiges Cache-Ergebnis haben (nicht älter als 5 Minuten)
    if (this.cachedEvents?.input === events && Date.now() - this.cachedEvents.timestamp < 300000) {
      this.events = this.cachedEvents.output.slice(0, this.limit)
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

    if (this.highlightEvents) {

      this.topics = await this.topicService.getAllTopics()
      const highlightTopic = this.topics.find((topic) => this.topicService.isTopicHighlight(topic))

      result = result.filter((event) => {
        const highlightId = highlightTopic?.id?.id
        if (!highlightId) return false

        const topics = event.topic ?? []
        return topics.some((topicRef) => {
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

    this.events = result.slice(0, this.limit)
    this.cdRef.markForCheck()
  }
}
