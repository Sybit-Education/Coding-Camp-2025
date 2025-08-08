import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  imports: [EventCardComponent, CommonModule, KategorieCardComponent, DatePipe, TranslateModule, RouterModule],
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

    this.topics = await this.topicService.getAllTopics();
    console.log('onInit: ',this.topics);
    try {
      const rawEvents = await this.eventService.getAllEvents();

      this.events = await Promise.all(
        rawEvents.map(async (event) => {
          const location = await this.locationService.getLocationByID(event.location);
          return {
            ...event,
            locationName: location?.name ?? 'Unbekannter Ort',
          };
        })
      );

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  }

  getCardClass(index: number): string {
    return 'w-[calc(100vw-6rem)] h-[280px]';
  }

  getTopics() {
    return this.topics;
  }



}
