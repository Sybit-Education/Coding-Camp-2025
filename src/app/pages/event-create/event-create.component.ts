import { CommonModule } from '@angular/common'
import { Component} from '@angular/core'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-event-create',
  imports: [FormsModule, CommonModule],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss',
})
export class EventCreateComponent {
  eventname=""
  description=""
  placename=""
  placeadress=""
}
