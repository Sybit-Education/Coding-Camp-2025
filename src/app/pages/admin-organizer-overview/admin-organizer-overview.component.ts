import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgxDatatableModule, SortEvent, SortDirection } from '@swimlane/ngx-datatable'
import { Router, RouterModule } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { OrganizerService } from '../../services/organizer.service'
import { EventService } from '../../services/event.service'
import type { Organizer } from '../../models/organizer.interface'
import type { Event } from '../../models/event.interface'
import type { RecordId } from 'surrealdb'
import { ConfirmDialogComponent } from '@app/component/confirm-dialog/confirm-dialog.component'
import { LiveAnnouncer } from '@angular/cdk/a11y'

@Component({
  selector: 'app-admin-organizer-overview',
  imports: [CommonModule, RouterModule, TranslateModule, NgxDatatableModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './admin-organizer-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrganizerOverviewComponent implements OnInit {
  private readonly organizerService = inject(OrganizerService)
  private readonly router = inject(Router)
  private readonly eventService = inject(EventService)
  private readonly translate = inject(TranslateService)
  private readonly liveAnnouncer = inject(LiveAnnouncer)

  protected readonly isLoading = signal<boolean>(true)
  protected readonly organizers = signal<Organizer[]>([])
  protected readonly hasData = computed(() => (this.organizers()?.length ?? 0) > 0)
  protected readonly organizerEventCounts = signal<Map<string, number>>(new Map())

  // Table settings for ngx-datatable
  protected readonly rows = signal<Record<string, unknown>[]>([])
  protected readonly temp = signal<Record<string, unknown>[]>([])
  protected readonly currentSorts = signal<{ prop: string; dir: SortDirection }[]>([{ prop: 'name', dir: SortDirection.asc }])
  protected filterValue = ''
  private readonly deleteContext = signal<{ id: RecordId<'organizer'>; name: string } | null>(null)
  protected readonly deleteDialogOpen = signal(false)
  protected readonly deleteDialogTitle = computed(() => this.translate.instant('ADMIN.ORGANIZERS.DELETE_CONFIRM_TITLE'))
  protected readonly deleteDialogMessage = computed(() => {
    const context = this.deleteContext()
    if (!context) {
      return this.translate.instant('ADMIN.ORGANIZERS.DELETE_CONFIRM_MESSAGE_DEFAULT')
    }
    return this.translate.instant('ADMIN.ORGANIZERS.DELETE_CONFIRM_MESSAGE', { name: context.name })
  })
  protected readonly deleteConfirmLabel = computed(() => this.translate.instant('COMMON.DELETE'))
  protected readonly deleteCancelLabel = computed(() => this.translate.instant('COMMON.CANCEL'))

  ngOnInit() {
    this.refresh()
  }

  protected async refresh() {
    this.isLoading.set(true)
    try {
      const [list, events] = await Promise.all([
        this.organizerService.getAllOrganizers(),
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
        eventCount: o.id ? (eventCounts.get(String(o.id)) ?? 0) : 0,
      }))

      this.organizers.set(sorted)
      this.rows.set(tableData)
      this.temp.set([...tableData])

      // Apply default sorting
      this.rows.set(this.sortData(tableData, this.currentSorts()))
      if (this.filterValue.trim()) {
        this.updateFilter()
      }
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

  protected requestOrganizerDeletion(row: Record<string, unknown>) {
    const organizerId = row?.['originalId'] as RecordId<'organizer'> | undefined
    if (!organizerId) return
    const relatedEvents = this.organizerEventCounts().get(String(organizerId)) ?? 0
    if (relatedEvents > 0) {
      this.liveAnnouncer.announce(this.translate.instant('ADMIN.ORGANIZERS.DELETE_FORBIDDEN'), 'assertive')
      return
    }

    this.deleteContext.set({
      id: organizerId,
      name: String(row?.['name'] ?? ''),
    })
    this.deleteDialogOpen.set(true)
  }

  protected async confirmOrganizerDeletion() {
    const context = this.deleteContext()
    if (!context) return

    try {
      await this.organizerService.delete(context.id)
      this.liveAnnouncer.announce(
        this.translate.instant('ADMIN.ORGANIZERS.DELETE_SUCCESS', { name: context.name }),
        'assertive',
      )
      await this.refresh()
    } catch (err) {
      console.error('[OrganizerOverview] Delete failed:', err)
      this.liveAnnouncer.announce(
        this.translate.instant('ADMIN.ORGANIZERS.DELETE_ERROR', { name: context.name }),
        'assertive',
      )
    } finally {
      this.cancelOrganizerDeletion()
    }
  }

  protected cancelOrganizerDeletion() {
    this.deleteDialogOpen.set(false)
    this.deleteContext.set(null)
  }

  // Sort handler for ngx-datatable
  protected onSort(event: SortEvent): void {
    this.currentSorts.set(event.sorts as { prop: string; dir: SortDirection }[])
    const data = [...this.temp()]
    const typedSorts = event.sorts as { prop: string; dir: SortDirection }[]
    this.rows.set(this.sortData(data, typedSorts))
  }

  protected updateFilter(): void {
    const val = this.filterValue.trim().toLowerCase()
    const filtered = this.temp().filter((row) => {
      if (!val) return true
      const name = row['name']?.toString().toLowerCase() ?? ''
      const email = row['email']?.toString().toLowerCase() ?? ''
      const phone = row['phonenumber']?.toString().toLowerCase() ?? ''
      return name.includes(val) || email.includes(val) || phone.includes(val)
    })

    const sortedRows = this.sortData(filtered, this.currentSorts())
    this.rows.set(sortedRows)

    const query = this.filterValue.trim()
    const announceKey = query ? 'ADMIN.ORGANIZERS.SEARCH_STATUS_FILTERED' : 'ADMIN.ORGANIZERS.SEARCH_STATUS_ALL'
    const message = this.translate.instant(announceKey, {
      count: sortedRows.length,
      query,
    })
    this.liveAnnouncer.announce(message, 'polite')
  }

  // Sort helper
  private sortData(data: Record<string, unknown>[], sorts: { prop: string; dir: SortDirection }[]): Record<string, unknown>[] {
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
