import { Component } from '@angular/core'
import { EventCarouselComponent } from '../../component/event-carousel/event-carousel.component'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
