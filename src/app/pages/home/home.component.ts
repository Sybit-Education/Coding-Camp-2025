import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';
import { LocationService } from '../../services/location.service';
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";
import { TopicService } from '../../services/topic.service';
import { Topic } from '../../models/topic.interface';

interface EventWithResolvedLocation extends Event {
  locationName: string;
}




@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, EventCardComponent, KategorieCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: EventWithResolvedLocation[] = [];

  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly topicService: TopicService = inject(TopicService);

  topics: Topic[] = [];

  ngOnInit() {
    this.initilizeData();
  }

  async initilizeData() {
    console.log('onInit: HomeComponent');

    this.topics = await this.topicService.getAllTopics();
    console.log('onInit: ',this.topics);
    try {
      const rawEvents = await this.eventService.getAllEvents();

      this.events = await Promise.all(
        rawEvents.map(async (event) => {
          const location = await this.locationService.getLocationByID(String(event.location.id));
          return {
            ...event,
            locationName: location?.name ?? 'Unbekannter Ort',
          };
        })
      );
      
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error);
    }
  }

  getCardClass(index: number): string {
    return 'w-[calc(100vw-6rem)] h-[280px]';
  }
  getTopics() {
    console.log(this.topics);
    return this.topics;
  }



}