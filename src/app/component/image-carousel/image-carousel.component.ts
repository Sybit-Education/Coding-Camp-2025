import { Component, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { IconComponent } from "@app/icons/icon.component";

@Component({
  selector: 'app-image-carousel',
  imports: [MatIconModule, IconComponent],
  templateUrl: './image-carousel.component.html',
})
export class ImageCarouselComponent {
  @Input() images: { url: string; copyright: string; creator: string }[] = []
  @Input() eventName = ''

  selectedImageIndex = 0
}
