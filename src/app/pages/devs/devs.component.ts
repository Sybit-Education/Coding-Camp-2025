import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ScreenSize } from '@app/models/screenSize.enum'
import { SharedStateService } from '@app/services/shared-state.service'
import { TranslateModule } from '@ngx-translate/core'
import { AsyncPipe } from '@angular/common'

@Component({
  selector: 'app-devs',
  imports: [TranslateModule, AsyncPipe],
  templateUrl: './devs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevsComponent {
  readonly sharedStateService = inject(SharedStateService)
  screenSize = ScreenSize
}
