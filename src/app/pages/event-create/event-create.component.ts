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

  eventname: string | null = null
  description: string | null = null
  placename: string | null = null
  placeadress: string | null = null
  organizer: string | null = null
  organizername: string | null = null
  organizerphone : string | null = null
  organizermail : string | null = null
  price: string | null = null
  moreInfoLink: string | null = null
  locationName: string | null = null
  organizerName: string | null = null
  selectedLocation: string | null = null
  selectedOrganizer: string | null = null
  address: string | null = null
  plz = 0
  city: string | null = null

  newLocation = false
  newOrganizer = false

  eventTypes: EventType[] = []
  locations: Location[] = []
  organizers: Organizer[] = []
  topics: Topic[] = []
eventType: string | null = null

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

  async saveLocation() {
    const location: Location = {
      name: this.locationName!,
      street: this.address!,
      zip_code: Number(this.plz),
      city: this.city!
    }

    try{
      const savedLocation = await this.locationService.postLocation(location);
      console.log("Saved Location ", savedLocation)
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  }

  async saveOrganizer() {
    const organizer: Organizer = {
      name: this.organizername!,
      email: this.organizermail!,
      phonenumber: Number(this.organizerphone)
    }

    try {
      const savedOrganizer = await this.organizerService.postOrganizer(organizer);
      console.log("Saved Organizer ", savedOrganizer)
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
    }
  }
}
