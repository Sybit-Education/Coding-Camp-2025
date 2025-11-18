import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core'

import { NgxDatatableModule, TableColumn, SortEvent, SortDirection } from '@swimlane/ngx-datatable'
import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { SurrealdbService } from '../../services/surrealdb.service'
import type { Organizer } from '../../models/organizer.interface'
import type { RecordId, StringRecordId } from 'surrealdb'

@Component({
  selector: 'app-admin-organizer-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NgxDatatableModule],
  templateUrl: './admin-organizer-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrganizerOverviewComponent implements OnInit {
  private readonly db = inject(SurrealdbService)
  private readonly router = inject(Router)

  protected readonly isLoading = signal<boolean>(true)
  protected readonly organizers = signal<Organizer[]>([])
  protected readonly hasData = computed(() => (this.organizers()?.length ?? 0) > 0)

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
      const list = await this.db.getAll<Organizer>('organizer')

      // Sort organizers by name (ascending)
      const sorted = [...(list ?? [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'))

      // Transform data for the table
      const tableData = sorted.map((o) => ({
        ...o,
        originalId: o.id, // Keep original ID for actions/navigation
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
}
