import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core'
import { SafeHtml } from '@angular/platform-browser'
import { IconRegistryService } from './icon-registry.service'

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="inline-block" [innerHTML]="safeSvg"></span>`,
  styles: [
    `
      :host {
        display: inline-block;
        line-height: 0;
        color: inherit;
      }
      :host(.size-5) {
        width: 1.25rem;
        height: 1.25rem;
      }
      :host(.size-8) {
        width: 2rem;
        height: 2rem;
      }
      :host(.h-6) {
        height: 1.5rem;
      }
      :host(.w-6) {
        width: 1.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnChanges {
  @Input() name!: string

  safeSvg: SafeHtml | null = null

  private readonly registry = inject(IconRegistryService)

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name']?.currentValue) {
      this.registry.get(this.name).subscribe({
        next: (svg) => (this.safeSvg = svg),
        error: () => (this.safeSvg = null),
      })
    }
  }
}
