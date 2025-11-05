import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-all-event-button',
  standalone: true,
  imports: [TranslateModule, RouterModule],
  templateUrl: './all-event-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllEventButtonComponent {}
