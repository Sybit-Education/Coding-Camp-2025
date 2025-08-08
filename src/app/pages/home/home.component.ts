import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";
import { TopicService } from '../../services/topic.service';
import { Topic } from '../../models/topic.interface';
import { TranslateModule } from '@ngx-translate/core';


interface EventWithResolvedLocation extends Event {
  locationName: string
}




@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, CommonModule, KategorieCardComponent, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: Event[] = [];
  topics: Topic[] = []

  private readonly eventService: EventService = inject(EventService);
  private readonly topicService: TopicService = inject(TopicService);

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

  getCardClass(): string {
    return 'w-[calc(100vw-6rem)] h-[280px]'
  }

  getTopics() {
    return this.topics;
  }
}