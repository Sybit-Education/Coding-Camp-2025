import { ChangeDetectionStrategy, Component, input, model } from '@angular/core'
import { IconComponent } from '../icon/icon.component'
import { TranslateModule } from '@ngx-translate/core'
import { CommonModule } from '@angular/common'

let searchIdCounter = 0

@Component({
  selector: 'app-search',
  imports: [IconComponent, TranslateModule, CommonModule],
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  readonly searchTerm = model<string>('')
  readonly searching = input<boolean>(false)
  readonly hasIcon = input<boolean>(false)

  protected readonly inputId = `search-input-${searchIdCounter++}`

  onSearchChange(value: string) {
    this.searchTerm.set(value)
  }
}
