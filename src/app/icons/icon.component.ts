import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, OnChanges, SimpleChanges, inject } from '@angular/core'
import { SafeHtml } from '@angular/platform-browser'
import { IconRegistryService } from '../services/icon-registry.service'
import { take } from 'rxjs'

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnChanges {
  @Input() name!: string
  @Input() ariaLabel?: string
  @Input() decorative = true

  @HostBinding('attr.role') get hostRole() {
    return this.decorative ? null : 'img'
  }
  @HostBinding('attr.aria-hidden') get hostAriaHidden() {
    return this.decorative && !this.ariaLabel ? 'true' : null
  }
  @HostBinding('attr.aria-label') get hostAriaLabel() {
    return this.decorative ? null : this.ariaLabel ?? null
  }

  safeSvg: SafeHtml | null = null

  private readonly registry = inject(IconRegistryService)
  private readonly cdr = inject(ChangeDetectorRef)

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name']?.currentValue) {
      this.registry.get(this.name).pipe(take(1)).subscribe({
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
