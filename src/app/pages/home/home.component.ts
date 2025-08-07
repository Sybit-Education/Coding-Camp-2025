import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";
import { TranslateModule } from '@ngx-translate/core';
import { LocationService } from '../../services/location.service';

interface EventWithResolvedLocation extends Event {
  locationName: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, CommonModule, KategorieCardComponent, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: EventWithResolvedLocation[] = [];

  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)

  async ngOnInit() {
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
}
