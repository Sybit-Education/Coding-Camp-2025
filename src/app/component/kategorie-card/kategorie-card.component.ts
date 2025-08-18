import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { RecordId } from 'surrealdb'

@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './kategorie-card.component.html',
})
export class KategorieCardComponent {
  @Input() text!: string
  @Input() color = ''
  @Input() id!: RecordId<'topic'>
}
