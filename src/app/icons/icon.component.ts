import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core'
import { SafeHtml } from '@angular/platform-browser'
import { IconRegistryService } from '../services/icon-registry.service'

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="app-icon-inner" [innerHTML]="safeSvg"></span>`,
  styles: [
    `
      :host {
        display: inline-block;
        line-height: 0;
        color: inherit;
        /* Größe über Tailwind-Klassen steuerbar (z. B. h-4, w-6).
           Wir setzen keine feste width/height mehr, sondern nur ein 1:1 Seitenverhältnis,
           damit sich die jeweils gesetzte Dimension (Höhe oder Breite) auf die andere überträgt. */
        aspect-ratio: 1 / 1;
      }
      :host .app-icon-inner {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnChanges {
  @Input() name!: string

  safeSvg: SafeHtml | null = null

  private readonly registry = inject(IconRegistryService)
  private readonly cdr = inject(ChangeDetectorRef)

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name']?.currentValue) {
      this.registry.get(this.name).subscribe({
        next: (svg) => {
          this.safeSvg = svg
          this.cdr.markForCheck()
        },
        error: () => {
          this.safeSvg = null
          this.cdr.markForCheck()
        },
      })
    }
  }
}
