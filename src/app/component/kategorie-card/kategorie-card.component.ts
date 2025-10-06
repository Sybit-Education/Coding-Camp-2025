import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { RecordId } from 'surrealdb'

@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './kategorie-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KategorieCardComponent {
  @Input() text!: string
  @Input() color = ''
  @Input() id!: RecordId<'topic'> | RecordId<'event_type'>
}
