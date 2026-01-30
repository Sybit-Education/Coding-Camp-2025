import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, signal, effect, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { EventService } from '@app/services/event.service'
import type { Event } from '@app/models/event.interface'
import { computeTextColor } from '@app/utils/color.utils'

interface Pill {
  label: string
  color?: string | null
  textColor: string
  slug: string
}

@Component({
  selector: 'app-event-type-pill',
  imports: [CommonModule, RouterModule],
  templateUrl: './event-type-pill.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventTypePillComponent {
  // Signal-based Inputs
  readonly event = input<Event | null>(null)
  readonly disabled = input<boolean>(false)

  // Services
  private readonly eventService = inject(EventService)

  // Local state
  protected readonly pill = signal<Pill | null>(null)

  constructor() {
    // Effect to rebuild pill when event changes
    effect(() => {
      const currentEvent = this.event()
      if (currentEvent) {
        void this.buildPill(currentEvent)
      } else {
        this.pill.set(null)
      }
    })
  }

  private async buildPill(event: Event): Promise<void> {
    if (!event?.event_type) {
      this.pill.set(null)
      return
    }

    const allEventType = await this.eventService.getAllEventTypes()
    const eventType = allEventType.find((et) => et.id.id === event.event_type?.id)

    if (!eventType?.name) {
      this.pill.set(null)
      return
    }

    const color = eventType.color ?? null
    const label = eventType.name
    const slug = eventType.slug

    this.pill.set({
      label,
      color,
      textColor: computeTextColor(color),
      slug,
    })
  }
}
