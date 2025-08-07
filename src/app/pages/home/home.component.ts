import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';
import { Location } from '../../models/location.interface';
import { LocationService } from '../../services/location.service';
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";

interface EventWithResolvedLocation extends Event {
  locationName: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, EventCardComponent, KategorieCardComponent, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: EventWithResolvedLocation[] = [];

  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly router: Router = inject(Router)

  ngOnInit() {
    this.loadEvents().catch(error => {
      console.error('Fehler beim Laden der Events:', error);
    });
  }

  private async loadEvents(): Promise<void> {
    const rawEvents = await this.eventService.getAllEvents();

    this.events = await Promise.all(
      rawEvents.map(async (event) => {
        const locationId = event.location as unknown as string;
        const location: Location = await this.locationService.getLocationByID(locationId);
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
