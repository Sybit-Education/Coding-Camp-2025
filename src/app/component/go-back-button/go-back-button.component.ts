import { Location } from '@angular/common'
import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { IconComponent } from '@app/component/icon/icon.component'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'app-go-back-button',
  imports: [TranslatePipe, RouterModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './go-back-button.component.html',
})
export class GoBackComponent {
  private readonly location = inject(Location)
  private readonly router = inject(Router)

  readonly goBackParams = input<string | null | undefined>(undefined)

  goBack(): void {
    if (this.goBackParams) {
      console.log('Navigating back with filterQuery:', this.goBackParams)
      this.router.navigate(['/event'], { queryParams: { filterQuery: this.goBackParams } })
      return
    }

    this.location.back()
  }
}
