import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import type { Event } from '@app/models/event.interface'
import { TopicService } from '@app/services/topic.service'
import { computeTextColor } from '@app/utils/color.utils'

interface Pill {
  label: string
  color?: string | null
  textColor: string
  slug: string
}

@Component({
  selector: 'app-event-topic-pill-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-topic-pill-list.component.html',
  styleUrls: ['./event-topic-pill-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventTopicPillListComponent implements OnChanges {
  @Input() event: Event | null = null

  pills: Pill[] = []

  private readonly topicService = inject(TopicService)
  private readonly cdr = inject(ChangeDetectorRef)

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['event']) {
      this.buildPills()
    }
  }

  private async buildPills(): Promise<void> {
    if (!this.event?.topic || this.event.topic.length === 0) {
      this.pills = []
      this.cdr.markForCheck()
      return
    }

    const allTopics = await this.topicService.getAllTopics()
    const result: Pill[] = []

    for (const t of this.event.topic) {
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
