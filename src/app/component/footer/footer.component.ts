import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IconComponent } from '@app/component/icon/icon.component'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslateModule, RouterModule, IconComponent],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
