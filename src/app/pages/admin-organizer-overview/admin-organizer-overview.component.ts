import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core'

import { NgxDatatableModule, SortEvent, SortDirection } from '@swimlane/ngx-datatable'
import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { SurrealdbService } from '../../services/surrealdb.service'
import { EventService } from '../../services/event.service'
import type { Organizer } from '../../models/organizer.interface'
import type { Event } from '../../models/event.interface'
import type { RecordId, StringRecordId } from 'surrealdb'

@Component({
  selector: 'app-admin-organizer-overview',
  imports: [CommonModule, RouterModule, TranslateModule, NgxDatatableModule],
  templateUrl: './admin-organizer-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrganizerOverviewComponent implements OnInit {
  private readonly db = inject(SurrealdbService)
  private readonly router = inject(Router)
  private readonly eventService = inject(EventService)

  protected readonly isLoading = signal<boolean>(true)
  protected readonly organizers = signal<Organizer[]>([])
  protected readonly hasData = computed(() => (this.organizers()?.length ?? 0) > 0)
  protected readonly organizerEventCounts = signal<Map<string, number>>(new Map())

  // Table settings for ngx-datatable
  protected readonly rows = signal<Record<string, unknown>[]>([])
  protected readonly temp = signal<Record<string, unknown>[]>([])
  protected readonly currentSorts = signal<{ prop: string; dir: SortDirection }[]>([
    { prop: 'name', dir: SortDirection.asc },
  ])

  ngOnInit() {
    this.refresh()
  }

  protected async refresh() {
    this.isLoading.set(true)
    try {
      const [list, events] = await Promise.all([
        this.db.getAll<Organizer>('organizer'),
        this.eventService.getAllEvents(),
      ])

      const eventCounts = this.buildOrganizerEventCounts(events ?? [])
      this.organizerEventCounts.set(eventCounts)

      // Sort organizers by name (ascending)
      const sorted = [...(list ?? [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))

      // Transform data for the table
      const tableData = sorted.map((o) => ({
        ...o,
        originalId: o.id, // Keep original ID for actions/navigation
        eventCount: o.id ? eventCounts.get(String(o.id)) ?? 0 : 0,
      }))

      this.organizers.set(sorted)
      this.rows.set(tableData)
      this.temp.set([...tableData])

      // Apply default sorting
      this.rows.set(this.sortData(tableData, this.currentSorts()))
    } catch (err) {
      console.error('[OrganizerOverview] Failed to load organizers:', err)
      this.organizers.set([])
    } finally {
      this.isLoading.set(false)
    }
  }

  protected createOrganizer() {
    this.router.navigate(['/admin/organizer/create'])
  }


  protected editOrganizer(organizerId: RecordId) {
    this.router.navigate(['/admin/organizer', String(organizerId)])
  }

  protected async deleteOrganizer(organizerId: RecordId) {
    const organizerKey = String(organizerId)
    const relatedEvents = this.organizerEventCounts().get(organizerKey) ?? 0
    if (relatedEvents > 0) {
      alert('Veranstalter kann nicht gelöscht werden, solange Events zugeordnet sind.')
      return
    }

    if (!confirm('Veranstalter wirklich löschen?')) return

    try {
      await this.db.deleteRow(String(organizerId) as unknown as StringRecordId)
      await this.refresh()
    } catch (err) {
      console.error('[OrganizerOverview] Delete failed:', err)
      alert('Löschen ist fehlgeschlagen.')
    }
  }

  // Sort handler for ngx-datatable
  protected onSort(event: SortEvent): void {
    this.currentSorts.set(event.sorts as { prop: string; dir: SortDirection }[])
    const data = [...this.temp()]
    const typedSorts = event.sorts as { prop: string; dir: SortDirection }[]
    this.rows.set(this.sortData(data, typedSorts))
  }

  // Sort helper
  private sortData(
    data: Record<string, unknown>[],
    sorts: { prop: string; dir: SortDirection }[],
  ): Record<string, unknown>[] {
    if (sorts.length === 0) return data

    const sort = sorts[0]
    const dir = sort.dir === SortDirection.asc || sort.dir === SortDirection.desc ? 1 : -1

    return [...data].sort((a, b) => {
      const propA = String(a[sort.prop] ?? '')
      const propB = String(b[sort.prop] ?? '')
      return dir * propA.localeCompare(propB, 'de')
    })
  }

  protected trackById(_index: number, item: Organizer) {
    return String(item.id ?? item.name)
  }

  private buildOrganizerEventCounts(events: Event[]): Map<string, number> {
    const counts = new Map<string, number>()

    for (const event of events ?? []) {
      if (!event?.organizer) continue
      const organizerKey = String(event.organizer)
      counts.set(organizerKey, (counts.get(organizerKey) ?? 0) + 1)
    }

    return counts
  }
}
