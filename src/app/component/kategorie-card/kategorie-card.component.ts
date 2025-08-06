import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kategorie-card',
  imports: [],
  templateUrl: './kategorie-card.component.html',
  styleUrl: './kategorie-card.component.scss'
})
export class KategorieCardComponent {
  @Input() kategorie = '';
}
