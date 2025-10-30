import { ChangeDetectionStrategy, Component } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-devs',
  imports: [TranslateModule],
  templateUrl: './devs.component.html',
  styleUrl: './devs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevsComponent {}
