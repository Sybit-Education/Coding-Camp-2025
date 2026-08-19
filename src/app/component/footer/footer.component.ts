import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IconComponent } from '@app/component/icon/icon.component'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe, RouterModule, IconComponent],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
