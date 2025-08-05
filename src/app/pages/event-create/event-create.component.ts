import { CommonModule } from '@angular/common'
import { Component, inject} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EventService } from '../../services/event.service'
import { EventType } from '../../models/event.interface'

@Component({
  selector: 'app-event-create',
  imports: [FormsModule, CommonModule],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss',
})
export class EventCreateComponent {

  private eventService: EventService = inject(EventService)

  eventname=""
  description=""
  placename=""
  placeadress=""
  organizer=""
  organizername=""
  organizerphone=""
  organizermail=""
  organizeradress=""
  price=""
  eventTypes: EventType[] = []

   ngOnInit(){
    this.initialzeTypes()
  }


  async initialzeTypes() {
    this.eventTypes =  await this.eventService.getAllEventTypes()
  }

 
}
