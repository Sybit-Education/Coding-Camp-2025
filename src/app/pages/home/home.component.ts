import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { KategorieCardComponent } from '../../component/kategorie-card/kategorie-card.component';
import { EventService } from '../../services/event.service';
import { LocationService } from '../../services/location.service';
import { Event } from '../../models/event.interface';
import { Location } from '../../models/location.interface';

interface EventWithResolvedLocation extends Event {
  locationName: string;
  mediaUrl: string;
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

  private readonly eventService = inject(EventService);
  private readonly locationService = inject(LocationService);

  private readonly mediaBaseUrl = 'https://1200-jahre-radolfzell.sybit.education/media/';

  async ngOnInit(): Promise<void> {
    try {
      const rawEvents = await this.eventService.getAllEvents();

      this.events = await Promise.all(
        rawEvents.map(async (event) => {
          const locationId = event.location as unknown as string;
          const location: Location = await this.locationService.getLocationByID(locationId);

          const mediaId = event.media?.[0]?.id;
          const mediaUrl = mediaId
            ? this.mediaBaseUrl + String(mediaId).replace(/_(?=[^_]*$)/, '.')
            : '';

          return {
            ...event,
            locationName: location?.name ?? 'Unbekannter Ort',
            mediaUrl,
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