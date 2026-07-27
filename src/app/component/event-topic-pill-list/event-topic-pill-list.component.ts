import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, input, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import type { Event } from '@app/models/event.interface'
import { TopicService } from '@app/services/topic.service'
import { computeTextColor } from '@app/utils/color.utils'
import { TranslatePipe } from '@ngx-translate/core'

interface Pill {
  label: string
  color?: string | null
  textColor: string
  slug: string
}

@Component({
  selector: 'app-event-topic-pill-list',
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './event-topic-pill-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventTopicPillListComponent {
  readonly event = input<Event | null>(null)

  pills: Pill[] = []

  accessibility = false
  accessibilityLable = ''
  accessibilityColor = ''
  accessibilitySlug = ''
  accessibilityTextColor = ''

  private readonly topicService = inject(TopicService)

  constructor() {
    effect(() => {
      // Signal lesen – effect triggert bei Änderungen
      this.event()
      void this.buildPills()
    })
  }

  private async buildPills(): Promise<void> {
    const event = this.event()
    if (!event?.topic || event.topic.length === 0) {
      this.pills = []
      return
    }

    const allTopics = await this.topicService.getAllTopics()
    const result: Pill[] = []

    for (const t of event.topic) {
      const topic = allTopics.find((top) => top.id?.id === t.id)
      if (topic?.name) {
        if (this.topicService.isTopicAccessibility(topic)) {
          this.accessibility = true
          this.accessibilityColor = topic.color
          this.accessibilitySlug = topic.slug
          this.accessibilityTextColor = computeTextColor(topic.color || null)
          continue
        }
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
  }
}
