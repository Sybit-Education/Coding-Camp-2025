import { Component, inject, OnDestroy, OnInit } from '@angular/core'
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

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    MapComponent,
    CommonModule,
    DateTimeRangePipe,
    FavoriteButtonComponent,
    TranslateModule,
    ShareComponent,
  ],
  styleUrl: './event-detail.component.scss',
  templateUrl: './event-detail.component.html',
})
export class EventDetailPageComponent implements OnInit, OnDestroy {
  private readonly subscriptions = new Subscription()
  event: Event | null = null
  location: Location | null = null
  organizer: Organizer | null = null
  type: TypeDB | null = null
  error: string | null = null
  eventId = ''

  mediaBaseUrl = 'https://1200-jahre-radolfzell.sybit.education/media/'
  mediaUrl: string | null = null

  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly organizerService = inject(OrganizerService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly loginservice = inject(LoginService)
  private readonly mediaService = inject(MediaService)

  protected isLoggedIn = false
  evntIdString: string | undefined

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id')!
    if (this.eventId) {
      const recordID = new StringRecordId('event:' + this.eventId)
      this.loadEvent(recordID)
    } else {
      this.error = 'Event ID nicht gefunden'
      this.announceError('Event ID nicht gefunden')
    }

    // Subscription für Login-Status
    this.subscriptions.add(
      this.loginservice.isLoggedIn$.subscribe(isLoggedIn => {
        this.isLoggedIn = isLoggedIn
      })
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

  async loadType(typeId: RecordId<'event_type'> | undefined): Promise<TypeDB | null> {
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

  async loadLocation(locationId: RecordId<'location'>): Promise<Location | null> {
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

  async loadOrganizer(organizerId: RecordId<'organizer'>): Promise<Organizer | null> {
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

      if (foundEvent) {
        // Setze Basis-Daten
        this.event = foundEvent
        this.evntIdString = this.event?.id ? this.event.id.toString() : undefined

        // Berechne Media-URL nur wenn Media vorhanden ist
        if (foundEvent.media && foundEvent.media.length > 0) {
          this.mediaUrl = await this.mediaService.getMediaUrl(foundEvent.media[0]);
        }

        // Extrahiere IDs für parallele Ladung
        const locationId = this.event?.['location']
        const organizerId = this.event?.['organizer']
        const typeId = this.event?.['event_type']

        // Lade alle abhängigen Daten parallel
        const [location, organizer, type] = await Promise.all([
          locationId ? this.loadLocation(locationId) : Promise.resolve(null),
          organizerId ? this.loadOrganizer(organizerId) : Promise.resolve(null),
          typeId ? this.loadType(typeId) : Promise.resolve(null)
        ])

        // Batch-Update für weniger Change Detection Zyklen
        requestAnimationFrame(() => {
          this.location = location
          this.organizer = organizer
          this.type = type
          document.title = `${this.event!.name} - 1200 Jahre Radolfzell`
        })
      } else {
        this.error = 'Event nicht gefunden'
        this.announceError('Event nicht gefunden')
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
      this.announceError(`Fehler beim Laden: ${err}`)
    }
  }

  goBack() {
    this.router.navigate(['/'])
  }

  redirect() {
    this.router.navigate(['/create-event'], {
      queryParams: {
        id: this.event!.id,
      }
    })
  }
}
