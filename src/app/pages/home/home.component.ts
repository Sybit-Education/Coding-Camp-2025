import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';
import { LocationService } from '../../services/location.service';
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";
import { TranslateModule } from '@ngx-translate/core';

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

  private readonly eventService = inject(EventService);
  private readonly locationService = inject(LocationService);

  ngOnInit() {
    this.loadEvents().catch(error => {
      console.error('Fehler beim Laden der Events:', error);
    });
  }

  private async loadEvents(): Promise<void> {
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
  }

  getCardClass(index: number): string {
    return 'w-[calc(100vw-6rem)] h-[280px]';
  }
}
