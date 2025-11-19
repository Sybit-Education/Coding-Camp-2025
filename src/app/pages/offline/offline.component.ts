import { ChangeDetectionStrategy, Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-offline',
  imports: [CommonModule, RouterModule],
  templateUrl: './offline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineComponent {}
