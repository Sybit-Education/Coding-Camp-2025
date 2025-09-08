import { Component, inject, signal, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Event } from '../../models/event.interface';
import { EventService } from '../../services/event.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { SurrealdbService } from '../../services/surrealdb.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-event-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NgxDatatableModule, FormsModule],
  templateUrl: './admin-event-overview.component.html',
  styleUrl: './admin-event-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AdminEventOverviewComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly surrealDb = inject(SurrealdbService);
  
  // Loading state
  isLoading = signal(true);
  
  // Events list
  events = signal<Event[]>([]);
  
  // Table settings
  rows = signal<any[]>([]);
  temp = signal<any[]>([]);
  columns = [
    { prop: 'date_start', name: 'Datum', sortable: true },
    { prop: 'name', name: 'Name', sortable: true },
    { prop: 'organizer', name: 'Veranstalter', sortable: true }
  ];
  
  // Filter value
  filterValue = '';
  
  async ngOnInit(): Promise<void> {
    try {
      const eventsList = await this.eventService.getAllEvents();
      
      // Sort events by start date (ascending)
      const sortedEvents = [...eventsList].sort((a, b) => {
        const dateA = new Date(a.date_start);
        const dateB = new Date(b.date_start);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Transform data for the table
      const tableData = sortedEvents.map(event => {
        return {
          ...event,
          date_start: this.formatDate(event.date_start),
          organizer: this.getOrganizerName(event),
          originalId: event.id // Keep original ID for actions
        };
      });
      
      this.events.set(sortedEvents);
      this.rows.set(tableData);
      this.temp.set([...tableData]);
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
  
  // Filter function
  updateFilter(): void {
    const val = this.filterValue.toLowerCase();
    
    // Filter data
    const temp = this.temp().filter(function(d) {
      return (
        d.name.toLowerCase().indexOf(val) !== -1 || 
        d.organizer.toLowerCase().indexOf(val) !== -1 ||
        d.date_start.toLowerCase().indexOf(val) !== -1 ||
        !val
      );
    });
    
    // Update rows
    this.rows.set([...temp]);
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
        
        // Transform data for the table
        const tableData = sortedEvents.map(event => {
          return {
            ...event,
            date_start: this.formatDate(event.date_start),
            organizer: this.getOrganizerName(event),
            originalId: event.id
          };
        });
        
        this.events.set(sortedEvents);
        this.rows.set(tableData);
        this.temp.set([...tableData]);
      } catch (error) {
        console.error('Fehler beim Löschen der Veranstaltung:', error);
      }
    }
  }
}
