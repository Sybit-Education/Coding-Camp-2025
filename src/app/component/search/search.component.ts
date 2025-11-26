import { Component, EventEmitter, Input, Output } from '@angular/core'
import { IconComponent } from '../icon/icon.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-search',
  imports: [IconComponent, TranslateModule],
  templateUrl: './search.component.html',
})
export class SearchComponent {
  @Input() searchTerm = ''
  @Input() searching = false
  @Input() hasIcon = false
  @Output() searchTermChange = new EventEmitter<string>()

  onSearchChange(value: string) {
    this.searchTerm = value
    this.searchTermChange.emit(this.searchTerm)
    console.log('Emitted Search Term:', this.searchTerm)
  }
}
