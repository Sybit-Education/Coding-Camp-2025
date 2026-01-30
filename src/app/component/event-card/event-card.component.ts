import { ChangeDetectionStrategy, Component, input, signal, effect, inject, DestroyRef, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Event, EventType } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { DateTimeRangePipe } from '../../services/date.pipe'
import { SurrealdbService } from '../../services/surrealdb.service'
import { LocationService } from '../../services/location.service'
import { LocalStorageService } from '../../services/local-storage.service'
import { MediaService } from '../../services/media.service'
import { TranslateModule } from '@ngx-translate/core'
import { MatIconModule } from '@angular/material/icon'
import { IconComponent } from '@app/component/icon/icon.component'
import { EventTypePillComponent } from '@app/component/event-type-pill/event-type-pill.component'
import { FavoriteButtonComponent } from '../favorite-button/favorite-button.component'

@Component({
  selector: 'app-event-card',
  imports: [
    CommonModule,
    DateTimeRangePipe,
    TranslateModule,
    RouterModule,
    MatIconModule,
    IconComponent,
    EventTypePillComponent,
    FavoriteButtonComponent,
  ],
  templateUrl: './event-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCardComponent {
  // Signal-based Input
  readonly event = input<Event | null>(null)

  // Services
  private readonly surrealDBService = inject(SurrealdbService)
  private readonly locationService = inject(LocationService)
  private readonly localStorageService = inject(LocalStorageService)
  private readonly mediaService = inject(MediaService)
  private readonly destroyRef = inject(DestroyRef)

  // Local state as signals
  protected readonly location = signal<Location | null>(null)
  protected readonly eventType = signal<EventType | null>(null)
  protected readonly isSaved = signal(false)
  protected readonly mediaUrl = signal<string | null>(null)

  // Computed properties
  protected readonly titleId = computed(() => {
    const ev = this.event()
    const id = ev?.id?.id ?? ev?.id ?? 'event'
    return `event-card-title-${id}`
  })

  protected readonly ariaLabel = computed(() => {
    const ev = this.event()
    const name = ev?.name || ''
    const loc = this.location()?.name ? ', ' + this.location()?.name : ''
    return name + loc
  })

  constructor() {
    // Effect to handle event changes
    effect(() => {
      const ev = this.event()
      if (ev?.id) {
        this.resetResolved()
        const id = ev.id as unknown as string
        this.isSaved.set(this.localStorageService.isEventSaved(id))
        void this.initializeEventDetails(ev)
      } else {
        this.resetResolved()
        this.isSaved.set(false)
      }
    })

    // Subscribe to saved events changes
    this.localStorageService.savedEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const ev = this.event()
        const id = (ev?.id as unknown as string) ?? null
        this.isSaved.set(id ? this.localStorageService.isEventSaved(id) : false)
      })
  }

  private resetResolved(): void {
    this.location.set(null)
    this.eventType.set(null)
    this.mediaUrl.set(null)
  }

  private async initializeEventDetails(event: Event): Promise<void> {
    try {
      // Verwende Promise.all für parallele Ausführung
      const [location, eventType, mediaUrl] = await Promise.all([
        this.loadLocation(event),
        this.loadEventType(event),
        this.loadMedia(event),
      ])

      // Update signals
      this.location.set(location)
      this.eventType.set(eventType)
      this.mediaUrl.set(mediaUrl)
    } catch (error) {
      console.error('Fehler beim Laden der Event-Details:', error)
      this.mediaUrl.set(null)
    }
  }

  private async loadLocation(event: Event): Promise<Location | null> {
    if (!event?.location) return null

    try {
      return await this.locationService.getLocationByID(event.location)
    } catch (error) {
      console.warn('Fehler beim Laden der Location:', error)
      return null
    }
  }

  private async loadEventType(event: Event): Promise<EventType | null> {
    if (!event?.event_type) return null

    try {
      const typeRecord = event.event_type
      const result = await this.surrealDBService.getByRecordId<{
        name: string
      }>(typeRecord)
      return (result?.name as EventType) || EventType.UNKNOWN
    } catch (error) {
      console.warn('Fehler beim Laden des Event Types:', error)
      return EventType.UNKNOWN
    }
  }

  private async loadMedia(event: Event): Promise<string | null> {
    if (!event?.media || event.media.length === 0) return null
    return await this.mediaService.getFirstMediaUrl(event.media)
  }
}
