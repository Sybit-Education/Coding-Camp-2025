import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  signal,
} from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './kategorie-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KategorieCardComponent {
  @Input() text!: string
  @Input() set color(value: string) {
    this.categoryColor.set(value || '#ffffff')
  }

  // Signals für reaktive Verarbeitung
  protected readonly categoryColor = signal<string>('#ffffff')
}
