import {
  Component,
  inject,
  signal,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
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
    { prop: 'date_start', name: 'Datum', sortable: true, width: 120 },
    { prop: 'name', name: 'Name', sortable: true, flexGrow: 2 },
    { prop: 'organizer', name: 'Veranstalter', sortable: true, flexGrow: 1 },
  ]

  // Filter value
  filterValue = ''

  async ngOnInit(): Promise<void> {
    try {
      // Lade alle Veranstalter und erstelle eine Map für schnellen Zugriff
      await this.loadOrganizers()

      const eventsList = await this.eventService.getAllEvents()

      // Sort events by start date (ascending)
      const sortedEvents = [...eventsList].sort((a, b) => {
        const dateA = new Date(a.date_start)
        const dateB = new Date(b.date_start)
        return dateA.getTime() - dateB.getTime()
      })

      // Transform data for the table
      const tableData = sortedEvents.map((event) => {
        return {
          ...event,
          date_start: this.formatDate(event.date_start),
          organizer: this.getOrganizerName(event),
          originalId: event.id, // Keep original ID for actions
        }
      })

      this.events.set(sortedEvents)
      this.rows.set(tableData)
      this.temp.set([...tableData])

      // Wende die Standardsortierung an
      this.rows.set(this.sortData(tableData, this.currentSorts()))
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      this.isLoading.set(false)
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
      const organizers = await this.organizerService.getAllOrganizers()
      const map = new Map<string, Organizer>()

      organizers.forEach((organizer) => {
        if (organizer.id) {
          map.set(String(organizer.id), organizer)
        }
      })

      this.organizersMap.set(map)
    } catch (error) {
      console.error('Fehler beim Laden der Veranstalter:', error)
    }
  }

  // Get organizer name
  getOrganizerName(event: Event): string {
    if (!event.organizer) return 'N/A'

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
      const propA = String(a[sort.prop] || '')
      const propB = String(b[sort.prop] || '')

      // Alle Werte werden als Strings behandelt
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
        d['date_start']?.toString().toLowerCase().indexOf(val) !== -1 ||
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
          date_start: this.formatDate(event.date_start),
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
