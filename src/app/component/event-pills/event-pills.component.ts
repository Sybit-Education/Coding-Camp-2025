import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core'
import { RouterModule } from '@angular/router'
import { TopicService } from '../../services/topic.service'
import { EventService } from '../../services/event.service'
import type { Event } from '../../models/event.interface'
import { computeTextColor } from '@app/utils/color.utils'


interface Pill {
  label: string
  color?: string | null
  textColor: string
  slug: string
}

/**
 * Rendert Pills (Tailwind-Stil) für event_type und topic eines Events.
 * - Klick auf eine Pill navigiert zur Kategorie-Seite: `${categoryRouteBase}/${slug}`
 * - Farben werden aus den jeweiligen Objekten (color) übernommen; Lesbarkeit via Kontrastberechnung.
 */
@Component({
  selector: 'app-event-pills',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-pills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventPillsComponent implements OnChanges {
  @Input() event: Event | null = null

  private readonly eventService = inject(EventService)
  private readonly topicService = inject(TopicService)

  pills: Pill[] = []

  private readonly cdr = inject(ChangeDetectorRef)

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['event']) {
      this.buildPills()
    }
  }

  private async buildPills(): Promise<void> {
    if (!this.event) {
      this.pills = []
      this.cdr.markForCheck()
      return
    }

    const result: Pill[] = []

    const allEventType = await this.eventService.getAllEventTypes()
    console.log('Alle Event Types geladen:', allEventType)
    const eventType = allEventType.find((et) => et.id.id === this.event?.event_type?.id)
    console.log('Event Type gefunden:', eventType)
    if (eventType?.name) {
      const color = eventType.color ?? null
      const label = eventType.name
      const slug = eventType.slug
      result.push({
        label,
        color,
        textColor: computeTextColor(color),
        slug,
      })
    }

    const allTopics = await this.topicService.getAllTopics()
    for (const t of this.event?.topic || []) {
      const topic = allTopics.find((top) => top.id?.id === t.id)
      if (topic?.name) {
        const color = topic.color ?? null
        const label = topic.name
        const slug = topic.slug
        result.push({
          label,
          color,
          textColor: computeTextColor(color),
          slug,
        })
      }
    }

    this.pills = result
    this.cdr.markForCheck()
  }
}
