import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { ActivatedRoute, Router } from '@angular/router'
import { QuillEditorComponent } from 'ngx-quill'

// Models
import { Event as AppEvent } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { Organizer } from '../../models/organizer.interface'
import { Topic } from '../../models/topic.interface'
import { TypeDB } from '../../models/typeDB.interface'
import { Decimal, RecordId, StringRecordId } from 'surrealdb'
import { Media } from '../../models/media.model'

// Services
import { EventService } from '../../services/event.service'
import { LocationService } from '../../services/location.service'
import { OrganizerService } from '../../services/organizer.service'
import { TopicService } from '../../services/topic.service'
import { MediaService } from '../../services/media.service'
import { CommonModule } from '@angular/common'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { sanitizeQuillContent } from '../../utils/quill-sanitizer'

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [FormsModule, TranslateModule, CommonModule, QuillEditorComponent],
  templateUrl: './event-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCreateComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>

  // ===== Services =====
  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly organizerService = inject(OrganizerService)
  private readonly topicService = inject(TopicService)
  private readonly mediaService = inject(MediaService)
  private readonly route = inject(ActivatedRoute)
  private readonly markForCheck = injectMarkForCheck()
  private readonly router = inject(Router)

  // ===== State & Formfelder =====
  event: AppEvent | null = null
  eventId: RecordId<'event'> | undefined = undefined
  eventName = ''
  description = ''
  moreInfoLink: string | null = null
  price: string | null = null
  dateStart = ''
  timeStart = ''
  dateEnd? = ''
  timeEnd? = ''
  age: number | null = null
  restriction: string | null = null
  draft = false
  timePeriode = false

  // Error States
  errorName = false
  errorDate = false
  errorTime = false

  // Location
  placename: string | null = null
  placeadress: string | null = null
  selectedLocation: Location | null = null
  locationName = ''
  address = ''
  plz = ''
  city = ''
  newLocation = false

  // Organizer
  selectedOrganizer: Organizer | null = null
  organizername: string | null = null
  organizermail: string | null = null
  organizerphone: string | null = null
  organizerName: string | null = null
  newOrganizer = false

  // Event Type & Topics
  selectedEventType: TypeDB | null = null
  selectedTopics: Topic[] = []
  eventType: string | null = null

  // Datenquellen
  locations: Location[] = []
  organizers: Organizer[] = []
  eventTypes: TypeDB[] = []
  topics: Topic[] = []

  // Images & Upload
  previews: string[] = []
  isDragging = false
  images: RecordId<'media'>[] = []

  // ===== Lifecycle =====
  ngOnInit() {
    // Prüfe, ob wir im Bearbeitungsmodus sind (URL-Parameter aus der Route)
    const eventId = this.route.snapshot.paramMap.get('id')
    if (eventId) {
      const recordID = new StringRecordId(eventId)
      this.loadEvent(recordID).then(() => this.markForCheck())
    } else {
      this.initializeData().then(() => this.markForCheck())
    }
  }

  // ===== Initial-Daten laden =====
  async initializeData() {
    this.organizers = await this.organizerService.getAllOrganizers()
    this.locations = await this.locationService.getAllLocations()
    this.eventTypes = await this.eventService.getAllEventTypes()
    this.topics = await this.topicService.getAllTopics()
  }

  private async loadEvent(eventId: RecordId<'event'> | StringRecordId) {
    await this.initializeData()
    try {
      const event = await this.eventService.getEventByID(eventId)
      if (!event) return

      this.event = event
      this.eventId = event.id!
      this.eventName = event.name
      this.description = event.description ?? ''
      this.moreInfoLink = event.more_info_link ?? null
      this.price = event.price?.toString() ?? null
      this.age = event.age ?? null
      this.restriction = event.restriction ?? null
      this.draft = event.draft ?? false
      this.images = event.media ?? []

      // Datum & Zeit
      const start = new Date(event.date_start)
      this.dateStart = start.toISOString().split('T')[0]
      this.timeStart = start.toTimeString().slice(0, 5)

      if (event.date_end) {
        const end = new Date(event.date_end)
        this.dateEnd = end.toISOString().split('T')[0]
        this.timeEnd = end.toTimeString().slice(0, 5)
        this.timePeriode = true
      }

      // Organizer
      // Organizer
      if (event.organizer) {
        const organizerId = event.organizer.id
        this.selectedOrganizer =
          this.organizers.find((o) => o.id?.id === organizerId) || null
        this.setOrganizer(this.selectedOrganizer)
      }

      // Location
      if (event.location) {
        const locationId = event.location.id
        this.selectedLocation =
          this.locations.find((l) => l.id?.id === locationId) || null
        this.setLocation(this.selectedLocation)
      }

      // Event Type
      const eventTypeId = event.event_type?.id
      this.selectedEventType =
        this.eventTypes.find((e) => e.id?.id === eventTypeId) || null
      this.setSelectedEventType(this.selectedEventType)

      // Topics
      const topicIds = event.topic || []
      for (const topicId of topicIds) {
        const topic = this.topics.find(
          (t) => t.id?.id === (topicId?.id ?? topicId),
        )
        if (topic) this.selectedTopics.push(topic)
      }

      // Images
      this.createPreview(null, event.media)
    } catch (err) {
      console.error('Fehler beim Laden des Events:', err)
    }
  }

  // ===== Auswahl-Handler =====
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

  // ===== File Upload Handling =====
  onAreaClick() {
    this.fileInput.nativeElement.click()
  }

  onDragOver(event: DragEvent) {
    event.preventDefault()
    this.isDragging = true
  }

  onDragLeave() {
    this.isDragging = false
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    this.isDragging = false
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files))
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) return
    this.handleFiles(Array.from(input.files))
    input.value = ''
  }

  private handleFiles(selected: File[]) {
    for (const file of selected) {
      if (!RegExp(/image\/(png|jpeg)/).exec(file.type)) {
        alert(`Dateityp nicht erlaubt: ${file.name}`)
        continue
      }
      const maxFileSize = 5 * 1024 * 1024
      if (file.size > maxFileSize) {
        alert(`Datei zu groß (max. 5 MB): ${file.name}`)
        continue
      }
      this.createPreview(file)
    }
  }

  private createPreview(
    file?: File | null,
    image?: RecordId<'media'>[] | null,
  ) {
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.previews.push(reader.result)
        }
      }
      reader.readAsDataURL(file)
    } else if (image) {
      image.forEach((image) => {
        this.mediaService.getMediaUrl(image).then((url) => {
          if (url) {
            this.previews.push(url)
          }
        })
      })
    }
    this.markForCheck()
  }

  removeImage(index: number) {
    this.previews.splice(index, 1)
  }

  // ===== Speichern =====
  async saveLocation() {
    if (!this.locationName) {
      console.error('Bitte einen Namen für die Location eingeben!')
      return
    }

    const location: Location = {
      name: this.locationName,
      street: this.address || undefined,
      zip_code: this.plz || undefined,
      city: this.city || 'Radolfzell',
    }

    try {
      console.log('Speichere neue Location:', location)
      const savedLocation = await this.locationService.postLocation(location)
      console.log('Location gespeichert:', savedLocation)
      this.selectedLocation = savedLocation
      this.newLocation = false // Formular schließen
    } catch (error) {
      console.error('Fehler beim Speichern der Location:', error)
    }
  }

  async saveOrganizer() {
    if (!this.organizername && !this.organizermail && !this.organizerphone) {
      return
    }
    const organizer: Organizer = {
      name: this.organizername || '',
      email: this.organizermail || undefined,
      phonenumber: this.organizerphone || undefined,
    }

    try {
      console.log('Speichere neuen Organizer:', organizer)
      const savedOrganizer =
        await this.organizerService.postOrganizer(organizer)
      console.log('Organizer gespeichert:', savedOrganizer)
      this.selectedOrganizer = savedOrganizer
      this.newOrganizer = false // Formular schließen
    } catch (error) {
      console.error('Fehler beim Speichern des Organizers:', error)
    }
  }

  async saveEvent() {
    if (!this.selectedLocation) await this.saveLocation()
    if (!this.selectedOrganizer) await this.saveOrganizer()

    if (
      this.eventName === '' ||
      this.dateStart === '' ||
      this.timeStart === ''
    ) {
      if (this.eventName === '') {
        this.errorName = true
      } else {
        this.errorName = false
      }
      if (this.dateStart === '') {
        this.errorDate = true
      } else {
        this.errorDate = false
      }
      if (this.timeStart === '') {
        this.errorTime = true
      } else {
        this.errorTime = false
      }
      return
    }
    this.errorName = false
    this.errorDate = false
    this.errorTime = false

    // Datum und Zeit verarbeiten
    const start = new Date(`${this.dateStart}T${this.timeStart}`)
    let end: Date | undefined
    if (this.timePeriode && this.dateEnd && this.timeEnd) {
      end = new Date(`${this.dateEnd}T${this.timeEnd}`)
    }

    // Preis konvertieren
    const priceDec = this.price ? new Decimal(this.price) : undefined

    // Medien verarbeiten
    const mediaIds = await this.getMediaIds()

    const payload: AppEvent = {
      name: this.eventName,
      date_start: start,
      date_end: end,
      description: sanitizeQuillContent(this.description) || undefined,
      more_info_link: this.moreInfoLink || undefined,
      price: priceDec,
      draft: this.draft,
      organizer: this.selectedOrganizer?.id ?? undefined,
      event_type: this.selectedEventType?.id ?? undefined,
      location: this.selectedLocation?.id ?? undefined,
      topic: this.selectedTopics.map((t) => t.id!),
      media: mediaIds,
      age: this.age ?? undefined,
      restriction: this.restriction || undefined,
    }

    // Event speichern (Update oder Create)
    if (this.eventId !== undefined) {
      const updated = await this.eventService.updateEvent(this.eventId, payload)
      if (!updated) {
        console.error('Update returned no data')
      } else {
        console.log('Event erfolgreich aktualisiert:', updated)
      }
    } else {
      const created = await this.eventService.postEvent(payload)
      if (created && created.length > 0) {
        this.eventId = created[0].id
        console.log('Event erfolgreich erstellt:', created[0])
      } else {
        console.error(
          'Erstellen des Events fehlgeschlagen, keine Daten zurückgegeben',
        )
        return
      }
    }

    // Nach erfolgreichem Speichern zur Admin-Übersicht navigieren
    this.router.navigate(['/admin'])
  }

  // ===== Media Handling =====
  async getMediaIds(): Promise<RecordId<'media'>[]> {
    const result: RecordId<'media'>[] = []
    result.push(...(await this.postNewImages()))
    return result
  }

  private async postNewImages(): Promise<RecordId<'media'>[]> {
    const result: RecordId<'media'>[] = []
    const resultMedias: Media[] = (
      await Promise.all(
        this.previews.map(async (image: string, i: number) => {
          if (image.startsWith('http')) {
            const existingMedia = await this.mediaService.getMediaByUrl(image)
            if (existingMedia) {
              return existingMedia
            } else {
              return null
            }
          } else {
            const newMedia: Media = {
              id: (this.eventName.replace(/[^a-zA-Z0-9]/g, '_') +
                '_' +
                i +
                '_' +
                image
                  .split(';')[0]
                  .split('/')[1]) as unknown as RecordId<'media'>,
              file: image.split(',')[1],
              fileName: this.eventName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + i,
              fileType: image.split(';')[0].split('/')[1],
            }
            return await this.mediaService.postMedia(newMedia)
          }
        }),
      )
    ).filter((media): media is Media => media !== null)
    result.push(...resultMedias.map((media) => media.id as RecordId<'media'>))
    return result
  }
}
