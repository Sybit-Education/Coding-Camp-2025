import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  input,
  signal,
  effect,
  inject,
  computed,
} from '@angular/core'
import { SafeHtml } from '@angular/platform-browser'
import { IconRegistryService } from '../../services/icon-registry.service'
import { take } from 'rxjs'

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  // Signal-based Inputs
  readonly name = input.required<string>()
  readonly ariaLabel = input<string>()
  readonly decorative = input<boolean>(true)

  // Services
  private readonly registry = inject(IconRegistryService)

  // Local state
  protected readonly safeSvg = signal<SafeHtml | null>(null)

  // Computed host bindings
  @HostBinding('attr.role') get hostRole() {
    return this.decorative() ? null : 'img'
  }
  @HostBinding('attr.aria-hidden') get hostAriaHidden() {
    return this.decorative() && !this.ariaLabel() ? 'true' : null
  }
  @HostBinding('attr.aria-label') get hostAriaLabel() {
    return this.decorative() ? null : (this.ariaLabel() ?? null)
  }

  constructor() {
    // Effect to load icon when name changes
    effect(() => {
      const iconName = this.name()
      if (iconName) {
        this.loadIcon(iconName)
      }
    })
  }

  private loadIcon(iconName: string): void {
    this.registry
      .get(iconName)
      .pipe(take(1))
      .subscribe({
        next: (svg) => {
          this.safeSvg.set(svg)
        },
        error: () => {
          this.safeSvg.set(null)
        },
      })
  }
}
