import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core'
import { FilterItem } from '@app/models/filterItem.interface'
import { IconComponent } from '../icon/icon.component'
import { SearchComponent } from '../search/search.component'
import { TranslateModule } from '@ngx-translate/core'

let dropdownIdCounter = 0

@Component({
  selector: 'app-custom-dropdown',
  imports: [IconComponent, CommonModule, SearchComponent, TranslateModule],
  templateUrl: './custom-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomDropdownComponent implements OnInit {
  readonly items = input<FilterItem[]>([])
  readonly placeholder = input<string>('')
  readonly preselectedItems = input<FilterItem[]>([])
  readonly defaultItems = input<FilterItem[]>([])

  readonly selectionChange = output<FilterItem[]>()

  protected readonly selectedItems = signal<FilterItem[]>([])
  protected readonly dropdownOpen = signal(false)
  protected readonly searchTerm = signal('')
  private readonly availableItems = signal<FilterItem[]>([])

  protected readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase()
    const base = this.availableItems()
    if (!term) return base
    return base.filter((item) => item.name.toLowerCase().includes(term))
  })

  protected readonly listboxId = `custom-dropdown-list-${dropdownIdCounter++}`
  protected readonly buttonId = `custom-dropdown-button-${dropdownIdCounter++}`

  private readonly elementRef = inject(ElementRef<HTMLElement>)

  ngOnInit() {
    const defaults = this.defaultItems()
    const preselected = this.preselectedItems()
    const initialSelected = [...defaults, ...preselected.filter((item) => !defaults.some((d) => d.id === item.id))]

    this.selectedItems.set(initialSelected)
    this.availableItems.set(this.items().filter((item) => !initialSelected.some((sel) => sel.id === item.id)))
    if (initialSelected.length) {
      this.emitSelection()
    }
  }

  toggleDropdown() {
    this.dropdownOpen.update((v) => !v)
  }

  addItem(item: FilterItem) {
    const currentSelected = this.selectedItems()
    if (currentSelected.some((i) => i.id === item.id) || currentSelected.length >= 5) return

    this.selectedItems.set([...currentSelected, item])
    this.availableItems.set(this.availableItems().filter((i) => i.id !== item.id))
    this.searchTerm.set('')
    this.emitSelection()
  }

  removeItem(item: FilterItem) {
    if (this.defaultItems().some((d) => d.id === item.id)) {
      return // Default-Item darf nicht entfernt werden
    }
    this.selectedItems.set(this.selectedItems().filter((i) => i.id !== item.id))
    this.availableItems.set([...this.availableItems(), item])
    this.emitSelection()
  }

  isSelected(item: FilterItem): boolean {
    return !!this.selectedItems().some((i) => i.id === item.id)
  }

  private emitSelection() {
    this.selectionChange.emit([...this.selectedItems()])
  }

  onSearchChange(searchInput: string) {
    this.dropdownOpen.set(true)
    this.searchTerm.set((searchInput ?? '').trim())
  }

  closeDropdown() {
    this.dropdownOpen.set(false)
  }

  focusNextOption(event: Event) {
    const keyboardEvent = event as KeyboardEvent
    const current = keyboardEvent.target as HTMLElement | null
    const next = current?.nextElementSibling as HTMLElement | null
    next?.focus()
    keyboardEvent.preventDefault()
  }

  focusPrevOption(event: Event) {
    const keyboardEvent = event as KeyboardEvent
    const current = keyboardEvent.target as HTMLElement | null
    const prev = current?.previousElementSibling as HTMLElement | null
    prev?.focus()
    keyboardEvent.preventDefault()
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target as Node) && this.dropdownOpen()) {
      this.dropdownOpen.set(false)
    }
  }
}
