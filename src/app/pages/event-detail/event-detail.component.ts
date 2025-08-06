import { Component, inject, OnInit } from '@angular/core'
import { MapComponent } from '../../component/map/map.component'
import { AddToCalendarComponent } from '../../component/calender/calendar.component'
import { Event, EventType } from '../../models/event.interface'
import { ActivatedRoute, Router } from '@angular/router'
import { SurrealdbService } from '../../services/surrealdb.service'
import { RecordId } from 'surrealdb'

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [MapComponent, AddToCalendarComponent],
  styleUrl: './event-detail.component.scss',
  templateUrl: './event-detail.component.html',
})
export class EventDetailPageComponent implements OnInit {
   event: Event | null = null
  location: Location | null = null
  type: EventType | null = null
  loading = true
  error: string | null = null

  private readonly surrealdbService = inject(SurrealdbService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id')
    if (eventId) {
      this.loadEvent(eventId)
      this.loadLocation(this.event?.location)
      this.loadType(this.event?.type)
    } else {
      this.error = 'Event ID nicht gefunden'
      this.loading = false
    }
  }

  async loadType(typeId: RecordId<'event_type'> | undefined) {
    try {
      const type = await this.surrealdbService.getTypeById(typeId!)
      if (type) {
        this.type = type
      } else {
        this.error = 'Event Type nicht gefunden'
      }
    } catch (err) {
      this.error = `Fehler beim Laden des Event Types: ${err}`
    }
  }

  async loadLocation(location: RecordId<'location'> | undefined) {
    try {
      this.loading = true
      const foundLocation = await this.surrealdbService.getLocationById(
        location!,
      )

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
      const foundEvent = await this.surrealdbService.getEventById(eventId)

      if (foundEvent) {
        this.event = foundEvent
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
