import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';

export interface DropdownItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-custom-dropdown',
  imports: [],
  templateUrl: './custom-dropdown.component.html'
})
export class CustomDropdownComponent implements OnInit {
  @Input() items: DropdownItem[] = [];
  @Input() placeholder = 'Select items';
  @Input() defaultItems: DropdownItem[] = []; // Optional: immer ausgewählte Items

  @Output() selectionChange = new EventEmitter<DropdownItem[]>();

  selectedItems: DropdownItem[] = [];
  dropdownOpen = false;

  ngOnInit() {
    if (this.defaultItems?.length) {
      this.selectedItems = [...this.defaultItems];
      this.emitSelection();
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  addItem(item: DropdownItem) {
    if (!this.selectedItems.some(i => i.id === item.id)) {
      this.selectedItems.push(item);
      this.emitSelection();
    }
  }

  removeItem(item: DropdownItem) {
    if (this.defaultItems.some(d => d.id === item.id)) {
      return; // Default-Item darf nicht entfernt werden
    }
    this.selectedItems = this.selectedItems.filter(i => i.id !== item.id);
    this.emitSelection();
  }

  isSelected(item: DropdownItem): boolean {
    return !!this.selectedItems.some(i => i.id === item.id);
  }

  private emitSelection() {
    this.selectionChange.emit([...this.selectedItems]);
  }
}