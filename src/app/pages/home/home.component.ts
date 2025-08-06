import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../component/event-card/event-card.component';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: Event[] = [];

  constructor(private eventService: EventService) {}

  async ngOnInit() {
    try {
      this.events = await this.eventService.getAllEvents();
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error);
    }
  }

  getCardClass(index: number): string {
 
    if (index === 0) {
      return 'w-[calc(100vw-6rem)] h-[280px]';
    }

    return 'w-[calc(100vw-6rem)] h-[280px]';
  }
}