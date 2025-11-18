import { Component, inject, signal, OnInit, ViewEncapsulation, ChangeDetectionStrategy, DestroyRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, NavigationEnd } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { Location } from '../../models/location.interface'
import { LocationService } from '../../services/location.service'
import { NgxDatatableModule, TableColumn, SortEvent, SortDirection } from '@swimlane/ngx-datatable'
import { FormsModule } from '@angular/forms'
import { RecordId } from 'surrealdb'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { filter } from 'rxjs/operators'

@Component({
  selector: 'app-admin-location-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NgxDatatableModule, FormsModule],
  templateUrl: './admin-location-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminLocationOverviewComponent implements OnInit {
  private readonly locationService = inject(LocationService)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  // Loading state
  isLoading = signal(true)

  // Locations list
  locations = signal<Location[]>([])

  // Table settings
  rows = signal<Record<string, unknown>[]>([])
  temp = signal<Record<string, unknown>[]>([])
  currentSorts = signal<{ prop: string; dir: SortDirection }[]>([
    { prop: 'name', dir: SortDirection.asc }, // Standardsortierung nach Name aufsteigend
  ])
  columns: TableColumn[] = [
    {
      prop: 'thumbnail',
      name: 'Bild',
      sortable: false,
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
      prop: 'city',
      name: 'Stadt',
      sortable: true,
      flexGrow: 1,
      resizeable: true,
    },
    {
      prop: 'street',
      name: 'Straße',
      sortable: true,
      flexGrow: 1,
      resizeable: true,
    },
    { name: 'Aktionen', sortable: false, width: 10, resizeable: false },
  ]

  // Filter value
  filterValue = ''

  ngOnInit(): void {
    // Locations laden
    this.loadLocations()

    // Bei jeder Navigation zur selben Route erneut laden
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event.urlAfterRedirects.startsWith('/admin/locations')) {
          this.loadLocations()
        }
      })
  }

  // Lade alle Locations
  private async loadLocations(): Promise<void> {
    try {
      const locationsList = await this.locationService.getAllLocations()

      // Sort locations by name (ascending)
      const sortedLocations = [...locationsList].sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '', 'de')
      })

      // Transform data for the table
      const tableData = sortedLocations.map((location) => {
        return {
          ...location,
          originalId: location.id, // Keep original ID for actions
          city: location.city || 'Radolfzell', // Default city
          street: location.street || '',
        }
      })

      this.locations.set(sortedLocations)
      this.rows.set(tableData)
      this.temp.set([...tableData])

      // Wende die Standardsortierung an
      this.rows.set(this.sortData(tableData, this.currentSorts()))
    } catch (error) {
      console.error('Error loading locations:', error)
    } finally {
      this.isLoading.set(false)
    }
  }

  // Navigate to edit location page
  editLocation(locationId: RecordId): void {
    this.router.navigate(['/admin/location', String(locationId)])
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
  private sortData(data: Record<string, unknown>[], sorts: { prop: string; dir: SortDirection }[]): Record<string, unknown>[] {
    if (sorts.length === 0) return data

    const sort = sorts[0] // Wir verwenden nur die erste Sortierung
    const dir = sort.dir === SortDirection.asc || sort.dir === SortDirection.desc ? 1 : -1

    return [...data].sort((a, b) => {
      // Für alle Spalten: String-Vergleich
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
        d['city']?.toString().toLowerCase().indexOf(val) !== -1 ||
        d['street']?.toString().toLowerCase().indexOf(val) !== -1 ||
        !val
      )
    })

    // Sortiere die gefilterten Daten
    const sortedTemp = this.sortData(temp, this.currentSorts())

    // Update rows
    this.rows.set(sortedTemp)
  }

  // Delete location
  async deleteLocation(locationId: RecordId) {
    if (confirm('Möchten Sie diesen Ort wirklich löschen?')) {
      try {
        // Verwende direkt den Location-Service zum Löschen
        await this.locationService.delete(locationId as RecordId<'location'>)
      } catch (deleteError) {
        console.error('Fehler beim Löschen:', deleteError)
      }

      // Refresh the locations list
      await this.loadLocations()
    }
  }
}
