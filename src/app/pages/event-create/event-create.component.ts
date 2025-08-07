import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'

// Services
import { EventService } from '../../services/event.service'
import { LocationService } from '../../services/location.service'
import { OrganizerService } from '../../services/organizer.service'
import { TopicService } from '../../services/topic.service'

// Interfaces
import { Event as AppEvent } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { Organizer } from '../../models/organizer.interface'
import { Topic } from '../../models/topic.interface'
import { TypeDB } from '../../models/typeDB.interface'
import { Decimal, RecordId } from 'surrealdb'
import { UploadImageComponent } from '../../component/upload-image/upload-image.component'
import { CommonModule } from '@angular/common'
import { Media } from '../../models/media.model'
import { MediaService } from '../../services/media.service'

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [FormsModule, UploadImageComponent, CommonModule],
  templateUrl: './event-create.component.html',
})
export class EventCreateComponent implements OnInit {
  // Services
  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly organizerService = inject(OrganizerService)
  private readonly topicService = inject(TopicService)
  private readonly mediaService = inject(MediaService)

  // Form-Felder
  eventname = ''
  description: string | null = null
  placename: string | null = null
  placeadress: string | null = null
  price: string | null = null
  moreInfoLink: string | null = null
  dateStart = ''
  timeStart = ''
  dateEnd? = ''
  timeEnd? = ''
  age: number | null = null
  restriction: string | null = null

  // Auswahlfelder & Zustand
  selectedLocation: Location | null = null
  selectedOrganizer: Organizer | null = null
  selectedEventType: TypeDB | null = null
  selectedTopics: Topic[] = []
  eventType: string | null = null

  // Eingabefelder für neue Location
  locationName = ''
  address = ''
  plz = ''
  city = ''
  newLocation = false

  // Eingabefelder für neuen Organizer
  organizername: string | null = null
  organizermail: string | null = null
  organizerphone: string | null = null
  organizerName: string | null = null
  newOrganizer = false

  // Datenquellen
  locations: Location[] = []
  organizers: Organizer[] = []
  eventTypes: TypeDB[] = []
  topics: Topic[] = []
  image: Media | null = null

  //Draft?
  draft = false
  media: Media[] = []
  timePeriode = false

  ngOnInit() {
    this.initializeData()
  }

  // Initial-Daten laden
  async initializeData() {
    this.organizers = await this.organizerService.getAllOrganizers()
    this.locations = await this.locationService.getAllLocations()
    this.eventTypes = await this.eventService.getAllEventTypes()
    this.topics = await this.topicService.getAllTopics()
    console.log('loaded organizer: ', this.organizers)
    console.log('loaded locations: ', this.locations)
    console.log('loaded topics: ', this.topics)
  }

  // Auswahl-Handler
  setLocation(location: Location) {
    this.selectedLocation = location

    if (location) {
      this.locationName = location.name
      this.address = location.street ?? ''
      this.plz = location.zip_code ?? ''
      this.city = location.city ?? ''
    }

    console.log('selected Location:', this.selectedLocation)
  }

  handleImage(media: Media) {
    if (media) {
      this.media.push(media)
    }
    console.log('mediaIds form Handle: ', media)
  }

  setOrganizer(organizer: Organizer) {
    this.selectedOrganizer = organizer

    if (organizer) {
      this.organizerName = organizer.name
      this.organizerphone = organizer.phonenumber ?? ''
      this.organizermail = organizer.email ?? ''
    }

    console.log('selected Organizer:', this.selectedOrganizer)
  }

  setEventType(eventType: TypeDB) {
    this.selectedEventType = eventType

    console.log('selected eventType:', this.selectedEventType)
  }

  toggleTopicSelection(event: Event, topic: Topic) {
    const checkbox = event['target'] as HTMLInputElement

    if (checkbox.checked) {
      this.selectedTopics.push(topic)
    } else {
      this.selectedTopics = this.selectedTopics.filter(
        (top) => top.id !== topic.id,
      )
    }

    console.log('selected topics: ', this.selectedTopics)
  }

  // Speichern
  async saveLocation() {
    console.log(
      'name: ',
      this.locationName,
      'street: ',
      this.address,
      'zip_code: ',
      this.plz,
      'city: ',
      this.city,
    )
    const location: Location = {
      name: this.locationName!,
      street: this.address!,
      zip_code: String(this.plz!),
      city: this.city!,
    }

    try {
      const savedLocation = await this.locationService.postLocation(location)
      console.log('Saved Location:', savedLocation)
    } catch (error) {
      console.error('Fehler beim Speichern der Location:', error)
    }
    this.selectedLocation = this.saveLocation as unknown as Location
  }

  async saveOrganizer() {
    const organizer: Organizer = {
      name: this.organizername!,
      email: this.organizermail!,
      phonenumber: this.organizerphone!,
    }

    try {
      const savedOrganizer =
        await this.organizerService.postOrganizer(organizer)
      console.log('Saved Organizer:', savedOrganizer)
      this.selectedOrganizer = savedOrganizer
    } catch (error) {
      console.error('Fehler beim Speichern des Organizers:', error)
    }
  }

  async saveEvent() {
    if (!this.selectedLocation) {
      await this.saveLocation()
    }

    if (!this.selectedOrganizer) {
      await this.saveOrganizer()
    }

    if (
      !this.selectedLocation ||
      !this.selectedOrganizer ||
      !this.selectedEventType
    ) {
      console.error('Bitte Location, Organizer und EventType auswählen!')
      return
    }

    // Datum + Zeit zu JS Date zusammenbauen
    const start = new Date(`${this.dateStart}T${this.timeStart}`)
    let end: Date | undefined
    if (this.dateEnd && this.timeEnd) {
      end = new Date(`${this.dateEnd}T${this.timeEnd}`)
    }

    // Preis in Decimal umwandeln
    const priceDec = this.price ? new Decimal(this.price) : undefined

    const mediaIds: RecordId<'media'>[] = this.getMediaIds()

    const payload: AppEvent = {
      name: this.eventname,
      date_start: start,
      date_end: end,
      description: this.description || undefined,
      more_info_link: this.moreInfoLink || undefined,
      price: priceDec,
      draft: this.draft,
      organizer: this.selectedOrganizer.id!,
      event_type: this.selectedEventType.id,
      location: this.selectedLocation.id!,
      topic: this.selectedTopics.map((t) => t.id!),
      media: mediaIds!,
      age: this.age != null ? this.age : undefined,
      restriction: this.restriction || undefined,
    }

    try {
      const created = await this.eventService.postEvent(payload)
      console.log('Event created:', created)
    } catch (err) {
      console.error('Fehler beim Erstellen des Events:', err)
    }
  }

  getMediaIds(): RecordId<'media'>[] {
    const ids: RecordId<'media'>[] = []

    this.media.forEach(async (med) => {
      med.id = (this.eventname.replace(/[^a-zA-Z0-9]/g, '_') +
        '_' +
        med.fileType.split('/')[1]) as unknown as RecordId<'media'>

      const result = await this.mediaService.postMedia(med)
      if (result.id) {
        ids.push(result.id)
      }
    })

    console.log('media after setting id', this.media)

    return ids
  }
}
