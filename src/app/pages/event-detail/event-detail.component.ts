import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { Subscription } from 'rxjs'
import { MapComponent } from '../../component/map/map.component'
import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { CommonModule } from '@angular/common'
import { Organizer } from '../../models/organizer.interface'
import { LocationService } from '../../services/location.service'
import { OrganizerService } from '../../services/organizer.service'
import { DateTimeRangePipe } from '../../services/date.pipe'
import { RecordId, StringRecordId } from 'surrealdb'
import { LoginService } from '../../services/login.service'
import { TypeDB } from '../../models/typeDB.interface'
import { TranslateModule } from '@ngx-translate/core'
import { FavoriteButtonComponent } from '../../component/favorite-button/favorite-button.component'
import { ShareComponent } from '../../component/share/share.component'
import { MediaService } from '@app/services/media.service'
import { ImageCarouselComponent } from '@app/component/image-carousel/image-carousel.component'
import { CalendarExportComponent } from "@app/component/calendar-export/calendar-export.component";

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MapComponent,
    DateTimeRangePipe,
    FavoriteButtonComponent,
    ShareComponent,
    ImageCarouselComponent,
    CalendarExportComponent
],
  styleUrl: './event-detail.component.scss',
  templateUrl: './event-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailPageComponent implements OnInit, OnDestroy {
  private readonly subscriptions = new Subscription()
  event: Event | null = null
  location: Location | null = null
  organizer: Organizer | null = null
  type: TypeDB | null = null
  error: string | null = null
  eventId = ''

  mediaUrl: (string | null)[] = []

  protected isLoggedIn = false
  private fromCategory = ''

  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly organizerService = inject(OrganizerService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly loginservice = inject(LoginService)
  private readonly mediaService = inject(MediaService)
  private readonly markForCheck = injectMarkForCheck()

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.fromCategory = params.get('fromCategory') || ''
      console.log('fromCategory:', this.fromCategory)
    })

    this.route.paramMap.subscribe((params) => {
      this.eventId = params.get('id') || ''
    })
    if (this.eventId) {
      const recordID = new StringRecordId('event:' + this.eventId)
      this.loadEvent(recordID)
    } else {
      this.error = 'Event ID nicht gefunden'
      this.announceError('Event ID nicht gefunden')
    }

    // Subscription für Login-Status
    this.subscriptions.add(
      this.loginservice.isLoggedIn$.subscribe((isLoggedIn) => {
        this.isLoggedIn = isLoggedIn
      }),
    )
  }

  ngOnDestroy(): void {
    // Alle Subscriptions beenden
    this.subscriptions.unsubscribe()
  }

  /**
   * Kündigt Fehler für Screenreader an
   * @param message Die Fehlermeldung
   */
  private announceError(message: string): void {
    // In einer vollständigen Implementierung würde hier LiveAnnouncer verwendet werden
    console.error(`Fehler: ${message}`)
  }

  async loadType(
    typeId: RecordId<'event_type'> | undefined,
  ): Promise<TypeDB | null> {
    if (typeId) {
      try {
        const type = await this.eventService.getEventTypeByID(typeId)
        if (type) {
          return type as unknown as TypeDB
        } else {
          this.error = 'Event Type nicht gefunden'
          return null
        }
      } catch (err) {
        this.error = `Fehler beim Laden des Event Types: ${err}`
        return null
      }
    } else {
      this.error = 'Event Type ID nicht gefunden'
      return null
    }
  }

  async loadLocation(
    locationId: RecordId<'location'>,
  ): Promise<Location | null> {
    try {
      const foundLocation =
        await this.locationService.getLocationByID(locationId)

      if (foundLocation) {
        return foundLocation
      } else {
        this.error = 'Location nicht gefunden'
        return null
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
      return null
    }
  }

  async loadOrganizer(
    organizerId: RecordId<'organizer'>,
  ): Promise<Organizer | null> {
    try {
      const foundOrganizer =
        await this.organizerService.getOrganizerByID(organizerId)

      if (foundOrganizer) {
        return foundOrganizer
      } else {
        this.error = 'Organizer nicht gefunden'
        return null
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
      return null
    }
  }

  private async loadEvent(eventId: RecordId<'event'> | StringRecordId) {
    try {
      const foundEvent = await this.eventService.getEventByID(eventId)

      if (!foundEvent) {
        this.error = 'Event nicht gefunden'
        this.announceError('Event nicht gefunden')
        return
      }

      // Setze Basis-Daten
      this.event = foundEvent

      // Starte alle Ladeprozesse parallel
      const promises: Promise<unknown>[] = []

      // Media-URL laden
      let mediaUrlPromise: Promise<(string | null)[]> = Promise.resolve([null])
      if (foundEvent.media?.length > 0) {
        mediaUrlPromise = Promise.all(
          foundEvent.media.map((mediaId) =>
            this.mediaService.getMediaUrl(mediaId),
          ),
        )
        promises.push(mediaUrlPromise)
      }

      // Extrahiere IDs für parallele Ladung
      const locationId = this.event?.['location']
      const organizerId = this.event?.['organizer']
      const typeId = this.event?.['event_type']

      // Lade alle abhängigen Daten parallel
      const locationPromise = locationId
        ? this.loadLocation(locationId)
        : Promise.resolve(null)
      const organizerPromise = organizerId
        ? this.loadOrganizer(organizerId)
        : Promise.resolve(null)
      const typePromise = typeId ? this.loadType(typeId) : Promise.resolve(null)

      promises.push(locationPromise, organizerPromise, typePromise)

      // Warte auf alle Promises
      await Promise.all(promises)

      // Batch-Update für weniger Change Detection Zyklen
      requestAnimationFrame(() => {
        if (foundEvent.media?.length > 0) {
          mediaUrlPromise.then((url) => {
            this.mediaUrl = url
          })
        }

        locationPromise.then((location) => (this.location = location))
        organizerPromise.then((organizer) => (this.organizer = organizer))
        typePromise.then((type) => (this.type = type))

        document.title = `${this.event!.name} - 1200 Jahre Radolfzell`
        this.markForCheck()
      })
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
      this.announceError(`Fehler beim Laden: ${err}`)
    }
  }

  goBack() {
    if (!this.fromCategory) {
      this.router.navigate(['/'])
    } else {
      this.router.navigate(['/kategorie'], {
        queryParams: {
          id: this.fromCategory.split(',')[0],
          name: this.fromCategory.split(',')[1] || '',
        },
      })
    }
  }

  editEvent() {
    this.router.navigate(['/admin/event', String(this.event!.id)])
  }

  startRoute() {
    const lat = this.location!.geo_point!.point[1]
    const lng = this.location!.geo_point!.point[0]

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

    window.open(url, '_blank')
  }

  /**
   * Generiert die Event-URL für die aktuelle Veranstaltung
   * Wird für die Meta-Tags verwendet
   */
  getEventUrl(): string {
    if (!this.event || !this.event.id) return window.location.href

    const id = this.event.id.id || ''
    const baseUrl = window.location.origin
    return `${baseUrl}/event/${id}`
  }
}
