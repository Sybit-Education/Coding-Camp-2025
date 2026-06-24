import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'app-all-event-button',
  imports: [TranslatePipe, RouterModule],
  templateUrl: './all-event-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllEventButtonComponent {}
