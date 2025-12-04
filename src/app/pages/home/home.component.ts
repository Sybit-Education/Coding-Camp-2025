import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

import { KategorieCardComponent } from '../../component/kategorie-card/kategorie-card.component'

import { EventService } from '../../services/event.service'
import { TopicService } from '../../services/topic.service'
import { LocationService } from '../../services/location.service'
import { RecordId } from 'surrealdb'

import { Event } from '../../models/event.interface'
import { Topic } from '../../models/topic.interface'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { TypeDB } from '@app/models/typeDB.interface'
import { SharedStateService } from '@app/services/shared-state.service'
import { ScreenSize } from '@app/models/screenSize.enum'
import { EventCardListComponent } from '@app/component/event-card-list/event-card-list.component'
import { IconComponent } from '@app/component/icon/icon.component'

@Component({
  selector: 'app-home',
  imports: [CommonModule, TranslateModule, RouterModule, KategorieCardComponent, IconComponent, EventCardListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  events: Event[] = []
  displayEvents: Event[] = []
  topics: Topic[] = []
  screenSize = ScreenSize

  topicsOrTypes: (Topic | TypeDB)[] = []

  readonly sharedStateService = inject(SharedStateService)
  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly topicService = inject(TopicService)
  private readonly router = inject(Router)
  private readonly markForCheck = injectMarkForCheck()

  ngOnInit() {
    this.initializeData().then(() => this.markForCheck())
  }

  async initializeData() {
    try {
      const [topics, eventTypes] = await Promise.all([this.topicService.getAllTopics(), this.eventService.getAllEventTypes()])

      const higlghtTopic = topics.find((topic) => topic.name === 'Highlights')
      if (higlghtTopic) {
        this.topics = [higlghtTopic, ...topics.filter((topic) => topic.id !== higlghtTopic.id)]
      } else {
        this.topics = topics
      }
      this.topicsOrTypes.push(...eventTypes, ...this.topics)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    }
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
