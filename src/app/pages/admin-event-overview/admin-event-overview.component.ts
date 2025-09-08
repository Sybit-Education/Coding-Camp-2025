import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Event } from '../../models/event.interface';
import { EventService } from '../../services/event.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { SurrealdbService } from '../../services/surrealdb.service';

@Component({
  selector: 'app-admin-event-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './admin-event-overview.component.html',
  styleUrl: './admin-event-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEventOverviewComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly surrealDb = inject(SurrealdbService);
  
  // Loading state
  isLoading = signal(true);
  
  // Events list
  events = signal<Event[]>([]);
  
  async ngOnInit(): Promise<void> {
    try {
      const eventsList = await this.eventService.getAllEvents();
      
      // Sort events by start date (ascending)
      const sortedEvents = [...eventsList].sort((a, b) => {
        const dateA = new Date(a.date_start);
        const dateB = new Date(b.date_start);
        return dateA.getTime() - dateB.getTime();
      });
      
      this.events.set(sortedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  // Format date for display
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Get organizer name
  getOrganizerName(event: Event): string {
    if (!event.organizer) return 'N/A';
    
    // If organizer is already an object with name property
    if (typeof event.organizer === 'object' && 'name' in event.organizer) {
      return event.organizer.name as string;
    }
    
    // Otherwise return the ID as string
    return String(event.organizer);
  }
  
  // Convert RecordId to string
  String(id: any): string {
    return String(id);
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
        // Use the SurrealDB service directly to delete the event
        await this.surrealDb.delete(`event:${eventId}`);
        
        // Refresh the events list
        const updatedEvents = await this.eventService.getAllEvents();
        
        // Sort and update the events signal
        const sortedEvents = [...updatedEvents].sort((a, b) => {
          const dateA = new Date(a.date_start);
          const dateB = new Date(b.date_start);
          return dateA.getTime() - dateB.getTime();
        });
        
        this.events.set(sortedEvents);
      } catch (error) {
        console.error('Fehler beim Löschen der Veranstaltung:', error);
      }
    }
  }
}
