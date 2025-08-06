import { Component, EventEmitter, Output } from '@angular/core'
import { MapComponent } from '../../component/map/map.component'
import { CalenderComponent } from '../../component/calender/calendar.component'
import { AboutComponent } from '../about/about.component'
import { SaveEventButtonComponent } from "../../component/save-event-button/save-event-button.component";

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [MapComponent, CalenderComponent, AboutComponent, SaveEventButtonComponent],
  styleUrl: './event-detail.component.scss',
  templateUrl: './event-detail.component.html',
})
export class EventDetailPageComponent {

}

