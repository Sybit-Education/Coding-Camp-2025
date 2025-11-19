import { Location } from '@angular/common'
import { Component, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IconComponent } from '@app/component/icon/icon.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-go-back-button',
  imports: [TranslateModule, RouterModule, IconComponent],
  templateUrl: './go-back-button.component.html',
})
export class GoBackComponent {
  private readonly location = inject(Location)

  goBack(): void {
    this.location.back()
  }
}
