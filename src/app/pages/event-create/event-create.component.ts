import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EventService } from '../../services/event.service'
import { EventType } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { Organizer } from '../../models/organizer.interface'
import { CommonModule } from '@angular/common'
import { LocationService } from '../../services/location.service'
import { OrganizerService } from '../../services/organizer.service'
import { TopicService } from '../../services/topic.service'
import { Topic } from '../../models/topic.interface'

@Component({
  selector: 'app-event-create',
  imports: [FormsModule, CommonModule],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss',
})
export class EventCreateComponent implements OnInit {
  private readonly eventService: EventService = inject(EventService)
  private readonly locationService: LocationService = inject(LocationService)
  private readonly organizerService: OrganizerService = inject(OrganizerService)
  private readonly topicService: TopicService = inject(TopicService)

  eventname = ''
  description = ''
  placename = ''
  placeadress = ''
  organizer = ''
  organizername = ''
  organizerphone = ''
  organizermail = ''
  price = ''
  moreInfoLink = ''
  locationName = ''
  organizerName = ''
  selectedLocation?: string
  selectedOrganizer?: string
  kp?: string
  address = ''
  plz = 0
  city = ''

  newLocation = false
  newOrganizer = false

  eventTypes: EventType[] = []
  locations: Location[] = []
  organizers: Organizer[] = []
  topics: Topic[] = []

  ngOnInit() {
    this.initialzeTypes()
    this.initialzeLocations()
    this.initialzeOrganizer()
    this.initialzeTopics()
  }

  async initialzeOrganizer() {
    this.organizers = await this.organizerService.getAllOrganizers()
  }

  async initialzeLocations() {
    this.locations = await this.locationService.getAllLocations()
  }

  async initialzeTypes() {
    this.eventTypes = await this.eventService.getAllEventTypes()
  }

  async initialzeTopics() {
    this.topics = await this.topicService.getAllTopics()
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
