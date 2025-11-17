import { Component, inject, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ScreenSize } from '@app/models/screenSize.enum'
import { SharedStateService } from '@app/services/shared-state.service'
import { AsyncPipe } from '@angular/common'
import { IconComponent } from '@app/icons/icon.component'

@Component({
  selector: 'app-event-image',
  imports: [MatIconModule, AsyncPipe, IconComponent],
  templateUrl: './event-image.component.html',
})
export class EventImageComponent {
  @Input() images: { url: string; copyright: string; creator: string }[] = []
  @Input() eventName = ''

  readonly sharedStateService = inject(SharedStateService)
  screenSize = ScreenSize

  selectedImageIndex = 0

  isFullscreen = false

  openFullscreen() {
    this.isFullscreen = true
  }

  closeFullscreen() {
    this.isFullscreen = false
  }
}
