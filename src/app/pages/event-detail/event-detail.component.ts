import { Component, inject, OnInit } from '@angular/core'
import { MapComponent } from '../../component/map/map.component'
import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { CommonModule } from '@angular/common'

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
  //type: EventType | null = null
  loading = true
  error: string | null = null

  mediaBaseUrl = 'https://1200-jahre-radolfzell.sybit.education/media/'
  mediaUrl: string | null = null

  private readonly eventService = inject(EventService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id')
    console.log(eventId)
    if (eventId) {
      this.loadEvent(eventId)
      console.log("init1")
      //this.loadType(this.event?.type)
    } else {
      this.error = 'Event ID nicht gefunden'
      this.loading = false
    }
  }

  /*async loadType(typeId: RecordId<'event_type'> | undefined) {
    try {
      const type = await this.eventService.getTypeById(typeId!)
      if (type) {
        this.type = type
      } else {
        this.error = 'Event Type nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden des Event Types: ${err}`
    }
  }*/

  async loadLocation(locationId: string) {
    try {
      this.loading = true
      const foundLocation = await this.eventService.getLocationByID(locationId)
      console.log('log:',foundLocation)

      if (foundLocation) {
        this.location = foundLocation
      } else {
        this.error = 'Location nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
    } finally {
      this.loading = false
    }
  }

  private async loadEvent(eventId: string) {
    try {
      this.loading = true
      console.log(eventId)
      const foundEvent = await this.eventService.getEventByID(eventId)

      if (foundEvent) {
        this.event = foundEvent
        this.mediaUrl = this.mediaBaseUrl + foundEvent.media[0].id.replace(/_(?=[^_]*$)/, '.')
        console.log("test:", foundEvent.media[0].id)
        this.loadLocation(foundEvent.location.id)
      } else {
        this.error = 'Event nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
    } finally {
      this.loading = false
    }
  }

  goBack() {
    this.router.navigate(['/'])
  }


}
