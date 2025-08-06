import { CommonModule } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EventService } from '../../services/event.service'
import { EventType } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { Organizer } from '../../models/organizer.interface'

@Component({
  selector: 'app-event-create',
  imports: [FormsModule, CommonModule],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss',
})
export class EventCreateComponent implements OnInit {
  private eventService: EventService = inject(EventService)

  eventname = ''
  description = ''
  placename = ''
  placeadress = ''
  organizer = ''
  organizername = ''
  organizerphone = ''
  organizermail = ''
  organizeradress = ''
  price = ''
  eventTypes: EventType[] = []
  moreInfoLink = ''
  newLocation = false
  newOrganizer = false
  locationName = ''
  organizerName = ''
  selectedLocation?: string
  selectedOrganizer?: string


  locations: Location[] = []
  address = ""
  plz = 0
  city = ""

  organizers: Organizer[] = []
  ngOnInit() {
    this.initialzeTypes()
    this.initialzeLocations()
  }


  initialzeLocations() {
    throw new Error('Method not implemented.')
  }

  async initialzeTypes() {
    this.eventTypes = await this.eventService.getAllEventTypes()
  }

  setLocation() {
    if (this.selectedLocation) {
      this.locationName = this.selectedLocation
    }
  }

    setOrganizer() {
    if (this.selectedOrganizer) {
      this.organizerName = this.selectedOrganizer
    }
  }
}
