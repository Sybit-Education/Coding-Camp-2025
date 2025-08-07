import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { EventCardComponent } from '../../component/event-card/event-card.component'
import { EventService } from '../../services/event.service'
import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { LocationService } from '../../services/location.service'
import { KategorieCardComponent } from '../../component/kategorie-card/kategorie-card.component'

interface EventWithResolvedLocation extends Event {
  locationName: string
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, EventCardComponent, KategorieCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  events: EventWithResolvedLocation[] = []

  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)

  async ngOnInit(): Promise<void> {
    try {
      const rawEvents = await this.eventService.getAllEvents()

      this.events = await Promise.all(
        rawEvents.map(async (event) => {
          const locationId = event.location as unknown as string
          const location: Location =
            await this.locationService.getLocationByID(locationId)
          return {
            ...event,
            locationName: location?.name ?? 'Unbekannter Ort',
          }
        }),
      )
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error)
    }
  }

  getCardClass(): string {
    return 'w-[calc(100vw-6rem)] h-[280px]'
  }
}
