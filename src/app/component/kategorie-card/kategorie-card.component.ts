import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core'
import { RouterModule } from '@angular/router'
import { FilterItem } from '@app/models/filterItem.interface'
import { computeTextColor } from '@app/utils/color.utils'

@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './kategorie-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KategorieCardComponent {
  readonly text = input.required<string>()
  readonly slug = input<string | undefined>(undefined)
  readonly color = input<string>('#ffffff')
  readonly id = input<string | undefined>(undefined)
  readonly filterOption = input<boolean>(false)
  readonly selected = model<boolean>(false)

  readonly categoryAdded = output<FilterItem>()

  protected readonly categoryColor = computed(() => this.color() || '#ffffff')

  protected addCategoryToFilter() {
    if (!this.filterOption()) return
    this.categoryAdded.emit({ id: this.id() || '', name: this.text() })
    this.selected.update((v) => !v)
  }

  protected handleFilterKey(event: Event) {
    if (!this.filterOption()) return
    event.preventDefault()
    this.addCategoryToFilter()
  }

  getcomputeTextColor(color: string): string {
    return computeTextColor(color)
  }
}
