import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule],
  templateUrl: './kategorie-card.component.html',
})
export class KategorieCardComponent {
  @Input() kategorie = '';
  @Input() color = '';
  @Input() text = '';
}
