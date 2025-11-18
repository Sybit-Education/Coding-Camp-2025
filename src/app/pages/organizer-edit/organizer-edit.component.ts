import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { SurrealdbService } from '../../services/surrealdb.service'
import type { Organizer } from '../../models/organizer.interface'

@Component({
  selector: 'app-organizer-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './organizer-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerEditComponent {
  private readonly db = inject(SurrealdbService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  protected readonly isEditMode = signal<boolean>(false)
  protected readonly loading = signal<boolean>(true)
  protected readonly saving = signal<boolean>(false)
  protected organizerId: string | null = null

  protected readonly form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string | null>(null, { validators: [Validators.email] }),
    phonenumber: new FormControl<string | null>(null),
  })

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id')
    if (idParam) {
      // Accept either pure id or full "organizer:<id>" format
      this.organizerId = idParam.includes(':') ? idParam : `organizer:${idParam}`
      this.isEditMode.set(true)
      await this.loadOrganizer()
    }
    this.loading.set(false)
  }

  private async loadOrganizer() {
    if (!this.organizerId) return
    try {
      const data = await this.db.getByRecordId<Organizer>(this.organizerId)
      this.form.patchValue({
        name: data.name ?? '',
        email: (data as any).email ?? null,
        phonenumber: (data as any).phonenumber ?? null,
      })
    } catch (err) {
      console.error('[OrganizerEdit] Failed to load organizer:', err)
      alert('Veranstalter konnte nicht geladen werden.')
      await this.router.navigate(['/admin/organizers'])
    }
  }

  protected async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.saving.set(true)
    const payload: Partial<Organizer> = {
      name: this.form.controls.name.value!,
      email: this.form.controls.email.value ?? undefined,
      phonenumber: this.form.controls.phonenumber.value ?? undefined,
    }

    try {
      if (this.isEditMode()) {
        await this.db.postUpdate<Organizer>(this.organizerId!, payload as Organizer)
      } else {
        await this.db.post<Organizer>('organizer', payload as Organizer)
      }
      await this.router.navigate(['/admin/organizers'])
    } catch (err) {
      console.error('[OrganizerEdit] Save failed:', err)
      alert('Speichern ist fehlgeschlagen.')
    } finally {
      this.saving.set(false)
    }
  }

  protected async delete() {
    if (!this.isEditMode() || !this.organizerId) return
    if (!confirm('Diesen Veranstalter wirklich löschen?')) return

    try {
      await this.db.deleteRow(this.organizerId)
      await this.router.navigate(['/admin/organizers'])
    } catch (err) {
      console.error('[OrganizerEdit] Delete failed:', err)
      alert('Löschen ist fehlgeschlagen.')
    }
  }

  protected cancel() {
    this.router.navigate(['/admin/organizers'])
  }
}
