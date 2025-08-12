import { Component, inject, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

// Services
import { EventService } from '../../services/event.service'
import { LocationService } from '../../services/location.service'
import { OrganizerService } from '../../services/organizer.service'
import { TopicService } from '../../services/topic.service'
import { ActivatedRoute } from '@angular/router'
import { Event as AppEvent } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { Organizer } from '../../models/organizer.interface'
import { Topic } from '../../models/topic.interface'
import { TypeDB } from '../../models/typeDB.interface'
import { Decimal, RecordId, StringRecordId } from 'surrealdb'
import { CommonModule } from '@angular/common'
import { Media } from '../../models/media.model'
import { MediaService } from '../../services/media.service'
import { UploadImageComponent } from '../../component/upload-image/upload-image.component'

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslateModule, UploadImageComponent],
  templateUrl: './event-create.component.html',
})
export class EventCreateComponent implements OnInit {
  event: AppEvent | null = null

  // Services
  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly organizerService = inject(OrganizerService)
  private readonly topicService = inject(TopicService)
  private readonly mediaService = inject(MediaService)

  constructor(private readonly route: ActivatedRoute) {}

  // Form-Felder
  eventId: RecordId<'event'> | undefined = undefined
  eventName = ''
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
  images: string[] = []
  timePeriode = false

  ngOnInit() {
    const eventId = this.route.snapshot.queryParams['id']
    if (eventId) {
      const recordID = new StringRecordId(eventId)
      this.loadEvent(recordID)
    } else {
      this.initializeData()
    }
  }

  private async loadEvent(eventId: RecordId<'event'> | StringRecordId) {
    await this.initializeData()

    try {
      const event = await this.eventService.getEventByID(eventId)
      if (!event) return
      this.event = event

      // Felder befüllen
      this.eventId = event.id!
      this.eventName = event.name
      this.description = event.description ?? null
      this.moreInfoLink = event.more_info_link ?? null
      this.price = event.price?.toString() ?? null
      this.age = event.age ?? null
      this.restriction = event.restriction ?? null
      this.draft = event.draft ?? false

      // Datum & Zeit splitten
      const start = new Date(event.date_start)
      this.dateStart = start.toISOString().split('T')[0]
      this.timeStart = start.toTimeString().slice(0, 5)

      if (event.date_end) {
        const end = new Date(event.date_end)
        this.dateEnd = end.toISOString().split('T')[0]
        this.timeEnd = end.toTimeString().slice(0, 5)
        this.timePeriode = true
      }

      // Organizer, Location, EventType, Topics aus Listen suchen
      const organizerId = String(event.organizer.id)
      this.selectedOrganizer =
        this.organizers.find((o) => String(o.id?.id) === organizerId) || null
      this.setOrganizer(this.selectedOrganizer)

      const locationId = String(event.location.id)
      this.selectedLocation =
        this.locations.find((l) => String(l.id?.id) === locationId) || null
      this.setLocation(this.selectedLocation)

      const eventTypeId = String(event.event_type?.id)
      this.selectedEventType =
        this.eventTypes.find((e) => String(e.id?.id) === eventTypeId) || null
      this.setSelectedEventType(this.selectedEventType)

      const topicIds = event.topic || []
      for (const topicId of topicIds) {
        const topic = this.topics.find(
          (t) => String(t.id?.id) === String(topicId?.id ?? topicId),
        )
        if (topic) {
          this.selectedTopics.push(topic)
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden des Events:', err)
    }
  }

  // Initial-Daten laden
  async initializeData() {
    this.organizers = await this.organizerService.getAllOrganizers()
    this.locations = await this.locationService.getAllLocations()
    this.eventTypes = await this.eventService.getAllEventTypes()
    this.topics = await this.topicService.getAllTopics()
  }

  // Auswahl-Handler
  setLocation(location: Location | null) {
    this.selectedLocation = location

    if (location) {
      this.locationName = location.name
      this.address = location.street ?? ''
      this.plz = location.zip_code ?? ''
      this.city = location.city ?? ''
    }
  }

  setOrganizer(organizer: Organizer | null) {
    this.selectedOrganizer = organizer

    if (organizer) {
      this.organizerName = organizer.name
      this.organizerphone = organizer.phonenumber ?? ''
      this.organizermail = organizer.email ?? ''
    }
  }

  setSelectedEventType(eventType: TypeDB | null) {
    this.selectedEventType = eventType
  }

  toggleTopicSelection(event: Event, topic: Topic) {
    const checked = (event.target as HTMLInputElement).checked
    if (checked) {
      this.selectedTopics.push(topic)
    } else {
      this.selectedTopics = this.selectedTopics.filter((t) => t.id !== topic.id)
    }
  }

  // Speichern
  async saveLocation() {
    const location: Location = {
      name: this.locationName,
      street: this.address,
      zip_code: String(this.plz),
      city: this.city,
    }

    try {
      const savedLocation = await this.locationService.postLocation(location)
      this.selectedLocation = savedLocation
    } catch (error) {
      console.error('Fehler beim Speichern der Location:', error)
    }
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

    const mediaIds: RecordId<'media'>[] =
      (await this.getMediaIds()) as unknown as RecordId<'media'>[]

    const payload: AppEvent = {
      name: this.eventName,
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
      media: mediaIds,
      age: this.age ?? undefined,
      restriction: this.restriction || undefined,
    }

    if (this.eventId !== undefined) {
      try {
        const updated = await this.eventService.updateEvent(
          this.eventId,
          payload,
        )
        if (!updated) {
          console.error('Update returned no data')
        }
      } catch (err) {
        console.error('Fehler beim Aktualisieren des Events:', err)
        return
      }
    } else {
      try {
        const created = await this.eventService.postEvent(payload)
        this.eventId = created[0].id
      } catch (err) {
        console.error('Fehler beim Erstellen des Events:', err)
      }
    }
  }

  async getMediaIds(): Promise<RecordId<'media'>[]> {
    const result: RecordId<'media'>[] = [] 

    result.push(...await this.postNewImages())

    return result
  }

  private async postNewImages(): Promise<RecordId<'media'>[]> {
    const resultMedias: Media[] = await Promise.all(
      this.images.map((image, i) => {
        const newMedia = {
          id: (this.eventName.replace(/[^a-zA-Z0-9]/g, '_') +
            '_' +
            i +
            '_' +
            image.split(';')[0].split('/')[1]) as unknown as RecordId<'media'>,
          file: image.split(',')[1],
          fileName: this.eventName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + i,
          fileType: image.split(';')[0].split('/')[1],
        }
        return this.mediaService.postMedia(newMedia)
      })
    )

    const resultMediasIds: RecordId<'media'>[] = resultMedias.map(
      (media) => media.id as RecordId<'media'>
    )
    return resultMediasIds
  }

  handleImage(media: string[]) {
    if (media) {
      media.forEach((med) => {
        this.images.push(med)
      })
    }
  }
}
