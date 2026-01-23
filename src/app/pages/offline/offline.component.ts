import { ChangeDetectionStrategy, Component } from '@angular/core'

import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-offline',
  imports: [RouterModule],
  templateUrl: './offline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineComponent {}
