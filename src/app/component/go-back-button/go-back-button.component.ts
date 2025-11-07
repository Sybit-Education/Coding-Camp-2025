import { Location } from '@angular/common'
import { Component, inject, Input } from '@angular/core'
import { NavigationExtras, Router, RouterModule } from '@angular/router'
import { IconComponent } from '@app/icons/icon.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-go-back-button',
  standalone: true,
  imports: [TranslateModule, RouterModule, IconComponent],
  templateUrl: './go-back-button.component.html',
})
export class GoBackComponent {
  @Input() siteToGo?: string | string[]
  @Input() queryParams?: Record<string, string | number | boolean | null | undefined>
  @Input() label? = 'zur Home Seite'

  private readonly router = inject(Router)
  private readonly location = inject(Location)

  goBack(): void {
    if (this.siteToGo) {
      const commands = Array.isArray(this.siteToGo) ? this.siteToGo : [this.siteToGo]
      const extras: NavigationExtras = this.queryParams ? { queryParams: this.queryParams } : {}
      this.router.navigate(commands, extras)
    } else {
      // Fallback
      this.location.back()
    }
  }
}
