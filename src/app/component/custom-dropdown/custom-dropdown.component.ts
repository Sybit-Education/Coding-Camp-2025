import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FilterItem } from '@app/models/filterItem.interface'
import { IconComponent } from '../icon/icon.component'
import { SearchComponent } from '../search/search.component'

@Component({
  selector: 'app-custom-dropdown',
  imports: [IconComponent, CommonModule, SearchComponent],
  templateUrl: './custom-dropdown.component.html',
})
export class CustomDropdownComponent implements OnInit {
  @Input() items: FilterItem[] = []
  @Input() placeholder = 'Select items'
  @Input() preselectedItems: FilterItem[] = [] // Optional: vorselektierte Items
  @Input() defaultItems: FilterItem[] = [] // Optional: immer ausgewählte Items

  @Output() selectionChange = new EventEmitter<FilterItem[]>()

  @ViewChild('selectButton', { static: false }) selectButton!: ElementRef<HTMLElement>

  selectedItems: FilterItem[] = []
  dropdownOpen = false

  searchTerm = ''
  filteredItems: FilterItem[] = []

  ngOnInit() {
    if (this.defaultItems?.length) {
      this.selectedItems = [...this.defaultItems]
      this.emitSelection()
    }
    console.log('Preselected Items:', this.preselectedItems)
    if (this.preselectedItems?.length) {
      this.selectedItems = [
        ...this.selectedItems,
        ...this.preselectedItems.filter((item) => !this.defaultItems.some((d) => d.id === item.id)),
      ]
      this.emitSelection()
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen
  }

  addItem(item: FilterItem) {
    if (!this.selectedItems.some((i) => i.id === item.id) && this.selectedItems.length < 5) {
      this.selectedItems.push(item)
      this.emitSelection()
      this.items = this.items.filter((i) => i.id !== item.id)
      this.searchTerm = ''
    }
  }

  removeItem(item: FilterItem) {
    if (this.defaultItems.some((d) => d.id === item.id)) {
      return // Default-Item darf nicht entfernt werden
    }
    this.selectedItems = this.selectedItems.filter((i) => i.id !== item.id)
    this.items.push(item)
    this.emitSelection()
  }

  isSelected(item: FilterItem): boolean {
    return !!this.selectedItems.some((i) => i.id === item.id)
  }

  private emitSelection() {
    this.selectionChange.emit([...this.selectedItems])
  }

  onSearchChange(searchInput: string) {
    this.dropdownOpen = true
    this.searchTerm = (searchInput ?? '').trim()

    if (this.searchTerm.length) {
      this.filteredItems = this.items.filter((item) => item.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
    }
  }
}
