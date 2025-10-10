import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core'
import { RouterModule } from '@angular/router'
import { RecordId } from 'surrealdb'
import { getContrastTextColor } from '../../utils/color.utils'

@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './kategorie-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KategorieCardComponent {
  @Input() text!: string
  @Input() set color(value: string) {
    this.backgroundColor.set(value || '#ffffff');
  }
  @Input() id!: RecordId<'topic'> | RecordId<'event_type'>
  
  // Signals für reaktive Verarbeitung
  protected readonly backgroundColor = signal<string>('#ffffff');
  
  // Berechne die optimale Textfarbe basierend auf der Hintergrundfarbe
  protected readonly textColor = computed(() => {
    return getContrastTextColor(this.backgroundColor()) === 'white' ? 'text-white' : 'text-black';
  });
}
