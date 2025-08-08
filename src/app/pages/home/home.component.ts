import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";

import { EventService } from '../../services/event.service';
import { TopicService } from '../../services/topic.service';

import { Event } from '../../models/event.interface';
import { Topic } from '../../models/topic.interface';

type EventOrMore = Event & { isMore?: boolean };
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    EventCardComponent,
    KategorieCardComponent
  , RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: Event[] = [];
  displayEvents: EventOrMore[] = [];
  topics: Topic[] = [];

  private readonly eventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly topicService = inject(TopicService)
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

      this.events = this.getUpcomingEvents(allEvents);

      this.displayEvents = this.events.slice(0, 4);

      if (this.events.length > 4) {
        this.displayEvents.push({} as Event); 
}

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
      });
  }

  getCardClass(index: number): string {
    return 'w-[calc(100vw-6rem)] h-[280px]';
  }

  getTopics() {
    return this.topics;
  }
}