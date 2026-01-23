import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core'
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
export class EventTypePillComponent implements OnChanges {
  @Input() event: Event | null = null
  @Input() disabled = false

  pill: Pill | null = null

  private readonly eventService = inject(EventService)
  private readonly cdr = inject(ChangeDetectorRef)

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['event']) {
      this.buildPill()
    }
  }

  private async buildPill(): Promise<void> {
    if (!this.event?.event_type) {
      this.pill = null
      this.cdr.markForCheck()
      return
    }

    const allEventType = await this.eventService.getAllEventTypes()
    const eventType = allEventType.find((et) => et.id.id === this.event?.event_type?.id)

    if (!eventType?.name) {
      this.pill = null
      this.cdr.markForCheck()
      return
    }

    const color = eventType.color ?? null
    const label = eventType.name
    const slug = eventType.slug

    this.pill = {
      label,
      color,
      textColor: computeTextColor(color),
      slug,
    }
    this.cdr.markForCheck()
  }
}
