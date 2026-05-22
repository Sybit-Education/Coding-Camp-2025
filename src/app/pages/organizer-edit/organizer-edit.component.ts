import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import type { Organizer } from '../../models/organizer.interface'
import type { Event } from '../../models/event.interface'
import { RecordId, StringRecordId } from 'surrealdb'
import { OrganizerService } from '@app/services/organizer.service'
import { EventService } from '@app/services/event.service'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { ConfirmDialogComponent } from '@app/component/confirm-dialog/confirm-dialog.component'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { LiveAnnouncer } from '@angular/cdk/a11y'

@Component({
  selector: 'app-organizer-edit',
  imports: [ReactiveFormsModule, RouterModule, ConfirmDialogComponent, TranslateModule],
  templateUrl: './organizer-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerEditComponent implements OnInit {
  private readonly organizerService = inject(OrganizerService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly eventService = inject(EventService)
  private readonly markForCheck = injectMarkForCheck()
  private readonly translate = inject(TranslateService)
  private readonly liveAnnouncer = inject(LiveAnnouncer)

  protected readonly isEditMode = signal<boolean>(false)
  protected readonly loading = signal<boolean>(true)
  protected readonly saving = signal<boolean>(false)
  protected readonly linkedEventsCount = signal<number>(0)
  protected organizerId: RecordId<'organizer'> | undefined = undefined
  protected readonly deleteDialogOpen = signal(false)
  protected readonly deleteDialogTitle = computed(() => this.translate.instant('ADMIN.ORGANIZERS.DELETE_CONFIRM_TITLE'))
  protected readonly deleteDialogMessage = computed(() => {
    const nameValue = this.form.controls.name.value?.trim()
    if (nameValue) {
      return this.translate.instant('ADMIN.ORGANIZERS.DELETE_CONFIRM_MESSAGE', { name: nameValue })
    }
    return this.translate.instant('ADMIN.ORGANIZERS.DELETE_CONFIRM_MESSAGE_DEFAULT')
  })
  protected readonly deleteConfirmLabel = computed(() => this.translate.instant('COMMON.DELETE'))
  protected readonly deleteCancelLabel = computed(() => this.translate.instant('COMMON.CANCEL'))

  protected readonly form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string | null>(null, { validators: [Validators.email] }),
    phonenumber: new FormControl<string | null>(null),
  })

  async ngOnInit() {
    const rawId = this.route.snapshot.paramMap.get('id')
    if (rawId) {
      const organizerId = new StringRecordId(rawId)
      this.isEditMode.set(true)
      await this.loadOrganizer(organizerId).then(() => this.markForCheck())
    }
    this.loading.set(false)
  }

  private async loadOrganizer(organizerId: RecordId<'organizer'> | StringRecordId) {
    try {
      const data = (await this.organizerService.getOrganizerByID(organizerId)) as Organizer
      this.organizerId = data.id!
      this.form.patchValue({
        name: data.name ?? '',
        email: data.email ?? null,
        phonenumber: data.phonenumber ?? null,
      })
      await this.updateLinkedEventsCount(this.organizerId)
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

  protected openDeleteDialog() {
    if (!this.isEditMode() || !this.organizerId) return
    if (this.linkedEventsCount() > 0) {
      this.liveAnnouncer.announce(this.translate.instant('ADMIN.ORGANIZERS.DELETE_FORBIDDEN'), 'assertive')
      return
    }
    this.deleteDialogOpen.set(true)
  }

  protected cancelDeleteDialog() {
    this.deleteDialogOpen.set(false)
  }

  protected async confirmDelete() {
    if (!this.organizerId) return
    try {
      await this.organizerService.delete(this.organizerId)
      this.liveAnnouncer.announce(
        this.translate.instant('ADMIN.ORGANIZERS.DELETE_SUCCESS', { name: this.form.controls.name.value ?? '' }),
        'assertive',
      )
      await this.router.navigate(['/admin/organizers'])
    } catch (err) {
      console.error('[OrganizerEdit] Delete failed:', err)
      this.liveAnnouncer.announce(
        this.translate.instant('ADMIN.ORGANIZERS.DELETE_ERROR', { name: this.form.controls.name.value ?? '' }),
        'assertive',
      )
    } finally {
      this.cancelDeleteDialog()
    }
  }

  protected cancel() {
    this.router.navigate(['/admin/organizers'])
  }

  private async updateLinkedEventsCount(organizerId: RecordId<'organizer'>) {
    try {
      const events = await this.eventService.getAllEvents()
      const count = this.countEventsForOrganizer(events ?? [], organizerId)
      this.linkedEventsCount.set(count)
    } catch (err) {
      console.error('[OrganizerEdit] Failed to load event references:', err)
      this.linkedEventsCount.set(0)
    }
  }

  private countEventsForOrganizer(events: Event[], organizerId: RecordId<'organizer'>): number {
    return events.reduce((acc, event) => {
      if (!event.organizer) {
        return acc
      }
      return String(event.organizer) === String(organizerId) ? acc + 1 : acc
    }, 0)
  }
}
