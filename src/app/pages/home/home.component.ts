import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { KategorieCardComponent } from '../../component/kategorie-card/kategorie-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, EventCardComponent, KategorieCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: Event[] = [];

  private readonly eventService = inject(EventService);

  async ngOnInit(): Promise<void> {
    await this.loadEvents();
  }

  private async loadEvents(): Promise<void> {
    try {
      this.events = await this.eventService.getAllEvents();
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error);
    }
  }

  getCardClass(index: number): string {
    return 'w-[calc(100vw-6rem)] h-[280px]';
  }
}