import { ChangeDetectionStrategy, Component } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-accessibility-statement',
  imports: [TranslateModule],
  templateUrl: './accessibility-statement.component.html',
  styleUrl: './accessibility-statement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityStatementComponent {}
