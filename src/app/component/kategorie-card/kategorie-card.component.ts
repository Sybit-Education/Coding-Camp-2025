import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core'
import { RouterModule } from '@angular/router'
import { FilterItem } from '@app/models/filterItem.interface'

@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './kategorie-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KategorieCardComponent {
  @Input() text!: string
  @Input() slug?: string
  @Input() set color(value: string) {
    this.categoryColor.set(value || '#ffffff')
  }
  @Input() id?: string
  @Input() filterOption = false

  @Output() categoryAdded = new EventEmitter<FilterItem>()

  selected = false

  // Signals für reaktive Verarbeitung
  protected readonly categoryColor = signal<string>('#ffffff')

  addCategoryToFilter() {
    if (this.filterOption) {
      this.categoryAdded.emit({ id: this.id || '', name: this.text })
      this.selected = !this.selected
    }
  }
}
