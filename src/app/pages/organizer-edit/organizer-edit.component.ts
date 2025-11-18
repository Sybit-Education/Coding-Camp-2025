import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import type { Organizer } from '../../models/organizer.interface'
import { RecordId, StringRecordId } from 'surrealdb'
import { OrganizerService } from '@app/services/organizer.service'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'

@Component({
  selector: 'app-organizer-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './organizer-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerEditComponent implements OnInit {
  private readonly organizerService = inject(OrganizerService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
    private readonly markForCheck = injectMarkForCheck()

  protected readonly isEditMode = signal<boolean>(false)
  protected readonly loading = signal<boolean>(true)
  protected readonly saving = signal<boolean>(false)
  protected organizerId: RecordId<'organizer'> | undefined = undefined

  protected readonly form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string | null>(null, { validators: [Validators.email] }),
    phonenumber: new FormControl<string | null>(null),
  })

  async ngOnInit() {
    const rawId = this.route.snapshot.paramMap.get('id')
    console.log("OrganizerID", rawId)
    if (rawId) {
      const organizerId= new StringRecordId(rawId)
      this.isEditMode.set(true)
      await this.loadOrganizer(organizerId).then(() => this.markForCheck())
    }
    this.loading.set(false)
  }

  private async loadOrganizer(organizerId: RecordId<'organizer'>|StringRecordId) {
    
    try {
      const data = await this.organizerService.getOrganizerByID(organizerId) as Organizer
      console.log(data)
      this.organizerId = data.id!
      this.form.patchValue({
        name: data.name ?? '',
        email: data.email ?? null,
        phonenumber: data.phonenumber ?? null,
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
    const payload: Organizer = {
      name: this.form.controls.name.value!,
      email: this.form.controls.email.value ?? undefined,
      phonenumber: this.form.controls.phonenumber.value ?? undefined,
    }

    try {
      if (this.organizerId) {
        await this.organizerService.update(this.organizerId, payload)
      } else {
        await this.organizerService.create(payload)
      }
      await this.router.navigate(['/admin/organizers'])
    } catch (err) {
      console.error('[OrganizerEdit] Save failed:', err)
      alert('Speichern ist fehlgeschlagen.')
    } finally {
      this.saving.set(false)
      this.markForCheck()
    }
  }

  protected async delete() {
    if (!this.isEditMode() || !this.organizerId) return
    if (!confirm('Diesen Veranstalter wirklich löschen?')) return

    try {
      await this.organizerService.delete(this.organizerId)
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
