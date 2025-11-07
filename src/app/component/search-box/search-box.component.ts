import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './search-box.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxComponent {
  @Output() searchChange = new EventEmitter<string>()

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement
    this.searchChange.emit(target.value ?? '')
  }
}
