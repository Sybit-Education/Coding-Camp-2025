import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';
import { KategorieCardComponent } from "../../component/kategorie-card/kategorie-card.component";

interface EventWithResolvedLocation extends Event {
  locationName: string;
}

interface Kategorie {
  color: string;
  text: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, CommonModule, KategorieCardComponent],
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

  kategorien: Kategorie[] = [
  { color: '#fdc61a', text: 'Ü18' },
  { color: '#389d73', text: 'Kostenlos' },
  { color: '#FF33A1', text: 'Für die ganze Familie' },
  { color: '#f5a48e', text: 'Kultur' },
  { color: '#72bdbb', text: 'Geschichte' },
  { color: '#6f77b8', text: 'Entfaltung' },
  { color: '#f197c0', text: 'Barrierefrei' },
  ];

  




}