import { Component } from '@angular/core'
import { MapComponent } from '../../component/map/map.component'
import { CalenderComponent } from '../../component/calender/calendar.component'
import { AboutComponent } from "../about/about.component";

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [MapComponent, CalenderComponent, AboutComponent],
  styleUrl: './event-detail.component.scss',
  templateUrl: './event-detail.component.html',
})
export class EventDetailPageComponent {}
