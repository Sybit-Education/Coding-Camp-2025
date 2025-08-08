import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { CommonModule } from '@angular/common';
import { EventService } from '../../services/event.service';
import { LocationService } from '../../services/location.service';
import { TopicService } from '../../services/topic.service';
import { Topic } from '../../models/topic.interface';


import { Event as AppEvent } from '../../models/event.interface';

interface EventWithResolvedLocation extends AppEvent {
  locationName: string;
}

@Component({
  selector: 'app-kategorie',
  standalone: true,
  imports: [TranslateModule, EventCardComponent, CommonModule],
  templateUrl: './kategorie.component.html',
  styleUrl: './kategorie.component.scss'
})
export class KategorieComponent  implements OnInit {
  events: EventWithResolvedLocation[] = [];

  topics: Topic[] = [];
  id: string | null = null;
  
  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {

    console.log('onInit: KategorieComponent');
    await this.initilizeData();

    console.log('onInit: KategorieComponent evetns:', this.events);
    this.route.queryParams.subscribe(params => {
      this.id = params['id'] || null;
    });
  }

  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly topicService: TopicService = inject(TopicService);

  

  async initilizeData() {
    console.log('onInit: HomeComponent');

    this.topics = await this.topicService.getAllTopics();
    console.log('onInit: ',this.topics);
    try {
      const rawEvents = await this.eventService.getAllEvents();
      console.log('Events aus Service kategorie:', rawEvents);

      this.events = await Promise.all(
        rawEvents.map(async (event) => {
          console.log('Event vor Location:', event);
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

    console.log('Events nach Promise.all:', this.events);
  }

  getCardClass(index: number): string {
    return 'w-[calc(100vw-6rem)] h-[280px]';
  }
}
