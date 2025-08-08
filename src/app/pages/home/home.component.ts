import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";
import { TopicService } from '../../services/topic.service';
import { Topic } from '../../models/topic.interface';
import { TranslateModule } from '@ngx-translate/core';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, CommonModule, KategorieCardComponent, TranslateModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: Event[] = [];
  topics: Topic[] = [];

  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly topicService: TopicService = inject(TopicService)
  private readonly router: Router = inject(Router)


  ngOnInit() {
    this.initializeData();
  }

  async initializeData() {
    console.log('onInit: HomeComponent');

    try {
        const [events, topics] = await Promise.all([
        this.eventService.getAllEvents(),
        this.topicService.getAllTopics()
      ]);

      this.events = events;
      this.topics = topics;

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  }

  private getUpcomingEvents(events: Event[]): Event[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return events
      .filter(event => {
        const eventStartDate = new Date(event.date_start);
        const eventStartDay = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());

        if (eventStartDay < today) {
          return false;
        }

        if (event.date_end) {
          const eventEndDate = new Date(event.date_end);
          return eventEndDate > now;
        } else {
          const endOfStartDay = new Date(eventStartDate);
          endOfStartDay.setHours(23, 59, 59, 999);
          return endOfStartDay > now;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.date_start);
        const dateB = new Date(b.date_start);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 4);
  }

  getCardClass(index: number): string {
    return 'w-[calc(100vw-6rem)] h-[280px]';
  }

  getTopics() {
    return this.topics;
  }

  /**
   * Behandelt Tastaturereignisse für die Event-Karten
   * @param event Das Tastaturereignis
   * @param eventId Die ID des Events
   */
  onKeyDown(event: KeyboardEvent, eventId?: string): void {
    // Enter oder Space aktiviert den Klick auf die Karte
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (eventId) {
        const cleanedId = eventId.replace(/^event:/, '');
        this.router.navigate(['/event', cleanedId]);
      }
    }
  }

}
