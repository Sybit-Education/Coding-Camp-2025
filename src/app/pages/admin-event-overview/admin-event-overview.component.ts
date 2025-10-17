import {
  Component,
  inject,
  signal,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, NavigationEnd } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { Event } from '../../models/event.interface'
import { EventService } from '../../services/event.service'
import { OrganizerService } from '../../services/organizer.service'
import {
  NgxDatatableModule,
  TableColumn,
  SortEvent,
  SortDirection,
} from '@swimlane/ngx-datatable'
import { FormsModule } from '@angular/forms'
import { Organizer } from '../../models/organizer.interface'
import { RecordId } from 'surrealdb'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-event-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NgxDatatableModule,
    FormsModule,
  ],
  templateUrl: './admin-event-overview.component.html',
  styleUrl: './admin-event-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminEventOverviewComponent implements OnInit {
  private readonly eventService = inject(EventService)
  private readonly organizerService = inject(OrganizerService)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  // Loading state
  isLoading = signal(true)

  // Events list
  events = signal<Event[]>([])

  // Organizers map for quick lookup
  organizersMap = signal<Map<string, Organizer>>(new Map())

  // Table settings
  rows = signal<Record<string, unknown>[]>([])
  temp = signal<Record<string, unknown>[]>([])
  currentSorts = signal<{ prop: string; dir: SortDirection }[]>([
    { prop: 'date_start', dir: SortDirection.asc }, // Standardsortierung nach Datum aufsteigend
  ])
  columns: TableColumn[] = [
    {
      prop: 'date_start',
      name: 'Datum',
      sortable: true,
      width: 10,
      flexGrow: 0,
      resizeable: false,
    },
    {
      prop: 'name',
      name: 'Name',
      sortable: true,
      flexGrow: 3,
      resizeable: true,
    },
    {
      prop: 'organizer',
      name: 'Veranstalter',
      sortable: true,
      flexGrow: 1,
      resizeable: true,
    },
    { name: 'Aktionen', sortable: false, width: 10, resizeable: false },
  ]

  // Filter value
  filterValue = ''

  ngOnInit(): void {
    // Zuerst alle Veranstalter laden, dann erst die Events
    this.loadOrganizersAndEvents();

      // Bei jeder Navigation zur selben Route erneut laden
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        if (event.urlAfterRedirects.startsWith('/admin/event')) {
          this.loadOrganizersAndEvents();
        }
      })
  }

  // Lade Organisatoren und dann Events in der richtigen Reihenfolge
  private async loadOrganizersAndEvents(): Promise<void> {
    try {
      // Zuerst Organisatoren laden
      await this.loadOrganizers();

      // Dann Events laden
      const eventsList = await this.eventService.getAllEvents();

      // Sort events by start date (ascending)
      const sortedEvents = [...eventsList].sort((a, b) => {
        const dateA = new Date(a.date_start);
        const dateB = new Date(b.date_start);
        return dateA.getTime() - dateB.getTime();
      });

      // Transform data for the table
      const tableData = sortedEvents.map((event) => {
        return {
          ...event,
          date_display: this.formatDate(event.date_start), // Formatiertes Datum für die Anzeige
          date_start: new Date(event.date_start).getTime(), // Timestamp für die Sortierung
          organizer: this.getOrganizerName(event),
          originalId: event.id, // Keep original ID for actions
        };
      });

      this.events.set(sortedEvents);
      this.rows.set(tableData);
      this.temp.set([...tableData]);

      // Wende die Standardsortierung an
      this.rows.set(this.sortData(tableData, this.currentSorts()));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Format date for display
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Lade alle Veranstalter und erstelle eine Map für schnellen Zugriff
  private async loadOrganizers(): Promise<void> {
    try {
      const organizers = await this.organizerService.getAllOrganizers();
      const map = new Map<string, Organizer>();

      for (const organizer of organizers) {
        if (organizer.id) {
          map.set(String(organizer.id), organizer);
        }
      }

      this.organizersMap.set(map);
    } catch (error) {
      console.error('Fehler beim Laden der Veranstalter:', error);
      throw error; // Fehler weiterleiten, damit die aufrufende Funktion reagieren kann
    }
  }

  // Get organizer name
  getOrganizerName(event: Event): string {
    if (!event.organizer) return ''

    // If organizer is already an object with name property
    if (typeof event.organizer === 'object' && 'name' in event.organizer) {
      return event.organizer.name as string
    }

    // Try to find organizer in our map
    const organizerId = String(event.organizer)
    const organizerMap = this.organizersMap()

    if (organizerMap.has(organizerId)) {
      return organizerMap.get(organizerId)?.name || 'Unbekannt'
    }

    // If it's a record ID, try to extract the name part
    if (organizerId.startsWith('organizer:')) {
      return organizerId.split(':')[1]
    }

    // Otherwise return the ID as string
    return organizerId
  }

  // Navigate to edit event page
  editEvent(eventId: RecordId): void {
    this.router.navigate(['/admin/event', String(eventId)])
  }

  // Sort handler
  onSort(event: SortEvent): void {
    // Aktualisiere den aktuellen Sortierzustand
    this.currentSorts.set(event.sorts as { prop: string; dir: SortDirection }[])

    // Sortiere die Daten
    const data = [...this.temp()]
    // Cast event.sorts to the expected type
    const typedSorts = event.sorts as { prop: string; dir: SortDirection }[]
    this.rows.set(this.sortData(data, typedSorts))
  }

  // Sortiere Daten basierend auf Sortierkriterien
  private sortData(
    data: Record<string, unknown>[],
    sorts: { prop: string; dir: SortDirection }[],
  ): Record<string, unknown>[] {
    if (sorts.length === 0) return data

    const sort = sorts[0] // Wir verwenden nur die erste Sortierung
    const dir =
      sort.dir === SortDirection.asc || sort.dir === SortDirection.desc ? 1 : -1

    return [...data].sort((a, b) => {
      // Spezielle Behandlung für Datumsspalte
      if (sort.prop === 'date_start') {
        const valueA = (a[sort.prop] as number) || 0
        const valueB = (b[sort.prop] as number) || 0
        return dir * (valueA - valueB)
      }

      // Für alle anderen Spalten: String-Vergleich
      const propA = String(a[sort.prop] || '')
      const propB = String(b[sort.prop] || '')
      return dir * propA.localeCompare(propB, 'de')
    })
  }

  // Filter function
  updateFilter(): void {
    const val = this.filterValue.toLowerCase()

    // Filter data
    const temp = this.temp().filter(function (d) {
      return (
        d['name']?.toString().toLowerCase().indexOf(val) !== -1 ||
        d['organizer']?.toString().toLowerCase().indexOf(val) !== -1 ||
        d['date_display']?.toString().toLowerCase().indexOf(val) !== -1 ||
        !val
      )
    })

    // Sortiere die gefilterten Daten
    const sortedTemp = this.sortData(temp, this.currentSorts())

    // Update rows
    this.rows.set(sortedTemp)
  }

  // Delete event
  async deleteEvent(eventId: RecordId) {
    if (confirm('Möchten Sie diese Veranstaltung wirklich löschen?')) {
      try {
        // Verwende direkt den Event-Service zum Löschen
        this.eventService.delete(eventId)
        console.log('Event erfolgreich gelöscht')
      } catch (deleteError) {
        console.error('Fehler beim Löschen:', deleteError)
      }

      // Refresh the events list
      const updatedEvents = await this.eventService.getAllEvents()

      // Sort and update the events signal
      const sortedEvents = [...updatedEvents].sort((a, b) => {
        const dateA = new Date(a.date_start)
        const dateB = new Date(b.date_start)
        return dateA.getTime() - dateB.getTime()
      })

      // Transform data for the table
      const tableData = sortedEvents.map((event) => {
        return {
          ...event,
          date_display: this.formatDate(event.date_start), // Formatiertes Datum für die Anzeige
          date_start: new Date(event.date_start).getTime(), // Timestamp für die Sortierung
          organizer: this.getOrganizerName(event),
          originalId: event.id,
        }
      })

      this.events.set(sortedEvents)
      this.temp.set([...tableData])

      // Wende die aktuelle Sortierung auf die neuen Daten an
      this.rows.set(this.sortData(tableData, this.currentSorts()))
    }
  }
}
