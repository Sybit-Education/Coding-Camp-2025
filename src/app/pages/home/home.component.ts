import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';

interface EventWithResolvedLocation extends Event {
  locationName: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: EventWithResolvedLocation[] = [];

  constructor(private eventService: EventService) {}

  async ngOnInit() {
    try {
      const rawEvents = await this.eventService.getAllEvents();

      this.events = await Promise.all(
        rawEvents.map(async (event) => {
          const location = await this.eventService.getLocationByID(event.location.id);
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
}