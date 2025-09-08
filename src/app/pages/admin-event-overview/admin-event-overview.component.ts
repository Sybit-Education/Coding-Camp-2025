import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Event } from '../../models/event.interface';
import { EventService } from '../../services/event.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-admin-event-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './admin-event-overview.component.html',
  styleUrl: './admin-event-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEventOverviewComponent {
  private readonly eventService = inject(EventService);
  
  // Loading state
  isLoading = signal(true);
  
  // Get all events and sort them by start date
  events = toSignal(
    this.eventService.getAllEvents().pipe(
      map(events => {
        // Sort events by start date (ascending)
        return [...events].sort((a, b) => {
          const dateA = new Date(a.date_start);
          const dateB = new Date(b.date_start);
          return dateA.getTime() - dateB.getTime();
        });
      })
    ),
    { initialValue: [] as Event[] }
  );
  
  // Format date for display
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Navigate to edit event page
  editEvent(eventId: string): void {
    // This will be implemented when we create the edit event page
    console.log('Edit event:', eventId);
  }
  
  // Delete event
  async deleteEvent(eventId: string): Promise<void> {
    if (confirm('Möchten Sie diese Veranstaltung wirklich löschen?')) {
      try {
        await this.eventService.deleteEvent(eventId);
        // Refresh the events list
        this.eventService.getAllEvents();
      } catch (error) {
        console.error('Fehler beim Löschen der Veranstaltung:', error);
      }
    }
  }
}
