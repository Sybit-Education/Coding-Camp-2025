import { Component } from '@angular/core'
import { MapComponent } from '../../component/map/map.component'
@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [MapComponent],
  styleUrl: './event-detail.component.scss',
  templateUrl: './event-detail.component.html',
})
export class EventDetailPageComponent {}
