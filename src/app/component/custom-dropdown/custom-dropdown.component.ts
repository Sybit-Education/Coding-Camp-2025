import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core'
import { CommonModule, NgClass } from '@angular/common'
import { FilterItem } from '@app/models/filterItem.interface'
import { IconComponent } from '../icon/icon.component'

@Component({
  selector: 'app-custom-dropdown',
  imports: [IconComponent, NgClass, CommonModule],
  templateUrl: './custom-dropdown.component.html',
})
export class CustomDropdownComponent implements OnInit {
  @Input() items: FilterItem[] = []
  @Input() placeholder = 'Select items'
  @Input() defaultItems: FilterItem[] = [] // Optional: immer ausgewählte Items

  @Output() selectionChange = new EventEmitter<FilterItem[]>()

  selectedItems: FilterItem[] = []
  dropdownOpen = false

  ngOnInit() {
    if (this.defaultItems?.length) {
      this.selectedItems = [...this.defaultItems]
      this.emitSelection()
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen
  }

  addItem(item: FilterItem) {
    if (!this.selectedItems.some((i) => i.id === item.id)) {
      this.selectedItems.push(item)
      this.emitSelection()
    }
  }

  removeItem(item: FilterItem) {
    if (this.defaultItems.some((d) => d.id === item.id)) {
      return // Default-Item darf nicht entfernt werden
    }
    this.selectedItems = this.selectedItems.filter((i) => i.id !== item.id)
    this.emitSelection()
  }

  isSelected(item: FilterItem): boolean {
    return !!this.selectedItems.some((i) => i.id === item.id)
  }

  private emitSelection() {
    this.selectionChange.emit([...this.selectedItems])
  }
}
