import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { SurrealdbService } from '../../services/surrealdb.service'
import type { Organizer } from '../../models/organizer.interface'

@Component({
  selector: 'app-admin-organizer-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-organizer-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrganizerOverviewComponent {
  private readonly db = inject(SurrealdbService)
  private readonly router = inject(Router)

  protected readonly isLoading = signal<boolean>(true)
  protected readonly organizers = signal<Organizer[]>([])
  protected readonly hasData = computed(() => (this.organizers()?.length ?? 0) > 0)

  ngOnInit() {
    this.refresh()
  }

  protected async refresh() {
    this.isLoading.set(true)
    try {
      const list = await this.db.getAll<Organizer>('organizer')
      this.organizers.set(list ?? [])
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

  protected editOrganizer(org: Organizer) {
    // id is typically "organizer:<id>" already; ensure string
    const id = (org as any).id?.toString?.() ?? org['id']
    this.router.navigate(['/admin/organizer', id])
  }

  protected async deleteOrganizer(org: Organizer) {
    const id = (org as any).id?.toString?.()
    if (!id) return
    if (!confirm(`Veranstalter wirklich löschen?\n\n${org.name}`)) return

    try {
      await this.db.deleteRow(id)
      await this.refresh()
    } catch (err) {
      console.error('[OrganizerOverview] Delete failed:', err)
      alert('Löschen ist fehlgeschlagen.')
    }
  }

  protected trackById(_index: number, item: Organizer) {
    return (item as any).id ?? item.name
  }
}
