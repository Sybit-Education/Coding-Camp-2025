import { Component, inject, signal, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Event } from '../../models/event.interface';
import { EventService } from '../../services/event.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { SurrealdbService } from '../../services/surrealdb.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { FormsModule } from '@angular/forms';
import { Organizer } from '../../models/organizer.interface';

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
  private readonly router = inject(Router);
  
  // Loading state
  isLoading = signal(true);
  
  // Events list
  events = signal<Event[]>([]);
  
  // Organizers map for quick lookup
  organizersMap = signal<Map<string, Organizer>>(new Map());
  
  // Table settings
  rows = signal<any[]>([]);
  temp = signal<any[]>([]);
  currentSorts = signal<any[]>([
    { prop: 'date_start', dir: 'asc' } // Standardsortierung nach Datum aufsteigend
  ]);
  columns = [
    { prop: 'date_start', name: 'Datum', sortable: true },
    { prop: 'name', name: 'Name', sortable: true },
    { prop: 'organizer', name: 'Veranstalter', sortable: true }
  ];
  
  // Filter value
  filterValue = '';
  
  async ngOnInit(): Promise<void> {
    try {
      // Lade alle Veranstalter und erstelle eine Map für schnellen Zugriff
      await this.loadOrganizers();
      
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
      
      // Wende die Standardsortierung an
      this.rows.set(this.sortData(tableData, this.currentSorts()));
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
  
  // Lade alle Veranstalter und erstelle eine Map für schnellen Zugriff
  private async loadOrganizers(): Promise<void> {
    try {
      const organizers = await this.surrealDb.getAll<Organizer>('organizer');
      const map = new Map<string, Organizer>();
      
      organizers.forEach(organizer => {
        if (organizer.id) {
          map.set(String(organizer.id), organizer);
        }
      });
      
      this.organizersMap.set(map);
    } catch (error) {
      console.error('Fehler beim Laden der Veranstalter:', error);
    }
  }
  
  // Get organizer name
  getOrganizerName(event: Event): string {
    if (!event.organizer) return 'N/A';
    
    // If organizer is already an object with name property
    if (typeof event.organizer === 'object' && 'name' in event.organizer) {
      return event.organizer.name as string;
    }
    
    // Try to find organizer in our map
    const organizerId = String(event.organizer);
    const organizerMap = this.organizersMap();
    
    if (organizerMap.has(organizerId)) {
      return organizerMap.get(organizerId)?.name || 'Unbekannt';
    }
    
    // If it's a record ID, try to extract the name part
    if (organizerId.startsWith('organizer:')) {
      return organizerId.split(':')[1];
    }
    
    // Otherwise return the ID as string
    return organizerId;
  }
  
  // Convert RecordId to string
  String(id: any): string {
    return String(id);
  }
  
  // Navigate to edit event page
  editEvent(eventId: string): void {
    // Entferne den "event:" Prefix, falls vorhanden
    const cleanId = eventId.startsWith('event:') ? eventId.substring(6) : eventId;
    this.router.navigate(['/admin/event', cleanId]);
  }
  
  // Sort handler
  onSort(event: any): void {
    // Aktualisiere den aktuellen Sortierzustand
    this.currentSorts.set(event.sorts);
    
    // Sortiere die Daten
    const data = [...this.temp()];
    this.rows.set(this.sortData(data, event.sorts));
  }
  
  // Sortiere Daten basierend auf Sortierkriterien
  private sortData(data: any[], sorts: any[]): any[] {
    if (sorts.length === 0) return data;
    
    const sort = sorts[0]; // Wir verwenden nur die erste Sortierung
    const dir = sort.dir === 'asc' || sort.dir === 'ASC' ? 1 : -1;
    
    return [...data].sort((a, b) => {
      const propA = a[sort.prop];
      const propB = b[sort.prop];
      
      // Vergleiche Strings
      if (typeof propA === 'string' && typeof propB === 'string') {
        return dir * propA.localeCompare(propB, 'de');
      }
      
      // Vergleiche andere Typen
      return dir * (propA > propB ? 1 : propA < propB ? -1 : 0);
    });
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
    
    // Sortiere die gefilterten Daten
    const sortedTemp = this.sortData(temp, this.currentSorts());
    
    // Update rows
    this.rows.set(sortedTemp);
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
        this.temp.set([...tableData]);
        
        // Wende die aktuelle Sortierung auf die neuen Daten an
        this.rows.set(this.sortData(tableData, this.currentSorts()));
      } catch (error) {
        console.error('Fehler beim Löschen der Veranstaltung:', error);
      }
    }
  }
}
