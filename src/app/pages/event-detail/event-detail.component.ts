import { Component, inject, OnInit } from '@angular/core'
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

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [MapComponent, CommonModule, DateTimeRangePipe],
  styleUrl: './event-detail.component.scss',
  templateUrl: './event-detail.component.html',
})
export class EventDetailPageComponent implements OnInit {
  event: Event | null = null
  location: Location | null = null
  organizer: Organizer | null = null
  type: TypeDB | null = null
  error: string | null = null

  mediaBaseUrl = 'https://1200-jahre-radolfzell.sybit.education/media/'
  mediaUrl: string | null = null

  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly organizerService = inject(OrganizerService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly loginservice = inject(LoginService)

  protected isLoggedIn = false

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id')
    if (eventId) {
      const recordID = new StringRecordId('event:' + eventId)
      this.loadEvent(recordID)
    } else {
      this.error = 'Event ID nicht gefunden'
      this.announceError('Event ID nicht gefunden')
    }
    this.isLoggedIn = this.loginservice.canActivate(this.route.snapshot)
  }

  /**
   * Kündigt Fehler für Screenreader an
   * @param message Die Fehlermeldung
   */
  private announceError(message: string): void {
    // In einer vollständigen Implementierung würde hier LiveAnnouncer verwendet werden
    console.error(`Fehler: ${message}`);
  }

  async loadType(typeId: RecordId<'event_type'> | undefined) {
    if (typeId) {
      try {
        const type = await this.eventService.getEventTypeByID(typeId)
        if (type) {
          this.type = type as unknown as TypeDB
        } else {
          this.error = 'Event Type nicht gefunden'
        }
      } catch (err) {
        this.error = `Fehler beim Laden des Event Types: ${err}`
      }
    } else {
      this.error = 'Event Type ID nicht gefunden'
    }
  }

  async loadLocation(locationId: RecordId<'location'>) {
    try {
      const foundLocation =
        await this.locationService.getLocationByID(locationId)

      if (foundLocation) {
        this.location = foundLocation
      } else {
        this.error = 'Location nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
    }
  }

  async loadOrganizer(organizerId: RecordId<'organizer'>) {
    try {
      const foundOrganizer =
        await this.organizerService.getOrganizerByID(organizerId)

      if (foundOrganizer) {
        this.organizer = foundOrganizer
      } else {
        this.error = 'Organizer nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
    }
  }

  private async loadEvent(eventId: RecordId<'event'> | StringRecordId) {
    try {
      const foundEvent = await this.eventService.getEventByID(eventId)

      if (foundEvent) {
        this.event = foundEvent

        console.log('Geladenes Event:', this.event)
        this.mediaUrl =
          this.mediaBaseUrl +
          String(foundEvent.media[0].id).replace(/_(?=[^_]*$)/, '.')
        const locationId = this.event?.['location']
        const organizerId = this.event?.['organizer']
        const typeId = this.event?.['event_type']

        await Promise.all([
          this.loadLocation(locationId),
          this.loadOrganizer(organizerId),
          this.loadType(typeId)
        ])

        document.title = `${this.event.name} - 1200 Jahre Radolfzell`
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
    console.log('Redirect triggered with ID:', this.event?.id)
    this.router.navigate(['/create-event'], {
      queryParams: {
        id: this.event!.id,
      },
    })

  }
}
