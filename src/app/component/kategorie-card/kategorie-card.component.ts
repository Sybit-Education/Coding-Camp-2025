import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-kategorie-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './kategorie-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KategorieCardComponent {
  @Input() text!: string
  @Input() slug?: string
  @Input() set color(value: string) {
    this.categoryColor.set(value || '#ffffff')
  }

  // Signals für reaktive Verarbeitung
  protected readonly categoryColor = signal<string>('#ffffff')

  get linkSlug(): string {
    return (this.slug && this.slug.trim()) || this.slugify(this.text || '')
  }

  private slugify(name: string): string {
    const map: Record<string, string> = {
      ä: 'ae',
      ö: 'oe',
      ü: 'ue',
      Ä: 'ae',
      Ö: 'oe',
      Ü: 'ue',
      ß: 'ss',
    }
    const replaced = name
      .split('')
      .map((c) => map[c] ?? c)
      .join('')
    return replaced
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
