import { Component, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'app-image-carousel',
  imports: [MatIconModule],
  templateUrl: './image-carousel.component.html',
})
export class ImageCarouselComponent {
  @Input() images: (string | null)[] = []
  @Input() eventName = ''

  selectedImageIndex = 0
}
