import { Component, inject, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ScreenSize } from '@app/models/screenSize.enum'
import { SharedStateService } from '@app/services/shared-state.service'
import { AsyncPipe } from '@angular/common'

@Component({
  selector: 'app-image-carousel',
  imports: [MatIconModule, AsyncPipe],
  templateUrl: './image-carousel.component.html',
})
export class ImageCarouselComponent {
  @Input() images: { url: string; copyright: string; creator: string }[] = []
  @Input() eventName = ''

  readonly sharedStateService = inject(SharedStateService)
  screenSize = ScreenSize

  selectedImageIndex = 0
}
