import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { RecordId } from 'surrealdb';

@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule],
  templateUrl: './kategorie-card.component.html',
})


export class KategorieCardComponent{
  @Input() text!: string; 
  @Input() color = '';
  @Input() id!: RecordId<'topic'>;

  constructor(private readonly router: Router) {}

  goToKategorie() {
    this.router.navigate(['/kategorie'], { queryParams: { id: this.id.id, name: this.text } });
  }
}
