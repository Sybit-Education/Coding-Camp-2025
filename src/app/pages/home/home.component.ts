import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

import { EventCardComponent } from '../../component/event-card/event-card.component'
import { KategorieCardComponent } from '../../component/kategorie-card/kategorie-card.component'

import { EventService } from '../../services/event.service'
import { TopicService } from '../../services/topic.service'
import { LocationService } from '../../services/location.service'
import { RecordId } from 'surrealdb'

import { Event } from '../../models/event.interface'
import { Topic } from '../../models/topic.interface'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { TypeDB } from '@app/models/typeDB.interface'

type EventOrMore = Event & { isMore?: boolean }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule,
    EventCardComponent,
    KategorieCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  events: Event[] = []
  displayEvents: EventOrMore[] = []
  topics: Topic[] = []

  topicsOrTypes: (Topic | TypeDB)[] = []

  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly topicService = inject(TopicService)
  private readonly router = inject(Router)
  private readonly markForCheck = injectMarkForCheck()

  ngOnInit() {
    // Initialisiere Daten und stelle sicher, dass Change Detection ausgelöst wird
    this.initializeData().then(() => this.markForCheck())
  }

  async initializeData() {
    try {
      const [events, topics, eventTypes] = await Promise.all([
        this.eventService.getAllEvents(),
        this.topicService.getAllTopics(),
        this.eventService.getAllEventTypes(),
      ])

      this.events = this.getUpcomingEvents(events)
      this.displayEvents = this.events.slice(0, 4)

      if (this.events.length > 4) {
        // Karte als Platzhalter für „Mehr anzeigen“
        this.displayEvents.push({ isMore: true } as EventOrMore)
      }

      console.log('EventTypes:', eventTypes)
      this.topicsOrTypes.push(...topics)
      this.topicsOrTypes.push(...eventTypes)

      console.log('TopicsOrTypes:', this.topicsOrTypes)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    }
  }

  // Cache für teure Berechnungen
  private cachedEvents: {
    input: Event[]
    output: Event[]
    timestamp: number
  } | null = null

  private getUpcomingEvents(events: Event[]): Event[] {
    // Prüfe, ob wir ein gültiges Cache-Ergebnis haben (nicht älter als 5 Minuten)
    if (
      this.cachedEvents &&
      this.cachedEvents.input === events &&
      Date.now() - this.cachedEvents.timestamp < 300000
    ) {
      return this.cachedEvents.output
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const result = events
      .filter((event) => {
        const eventStartDate = new Date(event.date_start)
        const eventStartDay = new Date(
          eventStartDate.getFullYear(),
          eventStartDate.getMonth(),
          eventStartDate.getDate(),
        )

        if (eventStartDay < today) {
          return false
        }

        if (event.date_end) {
          const eventEndDate = new Date(event.date_end)
          return eventEndDate > now
        } else {
          const endOfStartDay = new Date(eventStartDate)
          endOfStartDay.setHours(23, 59, 59, 999)
          return endOfStartDay > now
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.date_start)
        const dateB = new Date(b.date_start)
        return dateA.getTime() - dateB.getTime()
      })

    // Ergebnis cachen
    this.cachedEvents = {
      input: events,
      output: result,
      timestamp: Date.now(),
    }

    return result
  }

  getTopics() {
    return this.topics
  }

  /**
   * Behandelt Tastaturereignisse für die Event-Karten
   * @param event Das Tastaturereignis
   * @param eventId Die ID des Events
   */
  onKeyDown(event: KeyboardEvent, eventId?: RecordId<'event'>): void {
    // Enter oder Space aktiviert den Klick auf die Karte
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (eventId) {
        this.router.navigate(['/event', eventId.id])
      }
    }
  }
}
