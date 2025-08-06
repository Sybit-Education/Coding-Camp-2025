import { Component, inject, OnInit } from '@angular/core'
import { MapComponent } from '../../component/map/map.component'
import { Event, EventType } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { CommonModule } from '@angular/common'
import { Organizer } from '../../models/organizer.interface'
import { LocationService } from '../../services/location.service'
import { OrganizerService } from '../../services/organizer.service'

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [MapComponent, CommonModule],
  styleUrl: './event-detail.component.scss',
  templateUrl: './event-detail.component.html',
})
export class EventDetailPageComponent implements OnInit {
  event: Event | null = null
  location: Location | null = null
  organizer: Organizer | null = null
  type: EventType | null = null
  error: string | null = null

  mediaBaseUrl = 'https://1200-jahre-radolfzell.sybit.education/media/'
  mediaUrl: string | null = null

  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly organizerService = inject(OrganizerService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id')
    if (eventId) {
      this.loadEvent(eventId)
    } else {
      this.error = 'Event ID nicht gefunden'
    }
  }

  async loadType(typeId: string) {
    try {
      const type = await this.eventService.getEventTypeByID(typeId!)
      if (type) {
        this.type = type as EventType
      } else {
        this.error = 'Event Type nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden des Event Types: ${err}`
    }
  }

  async loadLocation(locationId: string) {
    try {
      const foundLocation = await this.locationService.getLocationByID(locationId)

      if (foundLocation) {
        this.location = foundLocation
      } else {
        this.error = 'Location nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
    }
  }

  async loadOrganizer(organizerId: string) {
    try {
      const foundOrganizer = await this.organizerService.getOrganizerByID(organizerId)

      if (foundOrganizer) {
        this.organizer = foundOrganizer
      } else {
        this.error = 'Organizer nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
    }
  }

  private async loadEvent(eventId: string) {
    try {
      const foundEvent = await this.eventService.getEventByID(eventId)

      if (foundEvent) {
        this.event = foundEvent
        this.mediaUrl = this.mediaBaseUrl + foundEvent.media[0].id.replace(/_(?=[^_]*$)/, '.')
        this.loadLocation(foundEvent.location.id)
        this.loadOrganizer(foundEvent.organizer.id)
        this.loadType(this.event?.type)
      } else {
        this.error = 'Event nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
    }
  }

  goBack() {
    this.router.navigate(['/'])
  }


}
