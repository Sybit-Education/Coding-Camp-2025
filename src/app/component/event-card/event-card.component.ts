import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'

import { Event, EventType } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { DateTimeRangePipe } from '../../services/date.pipe'
import { SurrealdbService } from '../../services/surrealdb.service'
import { LocationService } from '../../services/location.service'
import { LocalStorageService } from '../../services/local-storage.service'
import { MediaService } from '../../services/media.service'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, DateTimeRangePipe, TranslateModule],
  templateUrl: './event-card.component.html',
})
export class EventCardComponent implements OnInit, OnDestroy {
  @Input() event: Event | null = null

  location: Location | null = null
  eventType: EventType | null = null
  isSaved = false
  mediaUrl: string | null = null

  @Input() isMoreCard = false

  private subscriptions = new Subscription()

  private readonly surrealDBService = inject(SurrealdbService)
  private readonly locationService = inject(LocationService)
  private readonly router = inject(Router)
  private readonly localStorageService = inject(LocalStorageService)
  private readonly mediaService = inject(MediaService)

  ngOnInit() {
    if (this.event?.id) {
      this.initializeSavedState()
      this.initializeEventDetails()
    }
  }

  private initializeSavedState(): void {
    if (!this.event?.id) return

    const eventId = this.event.id as unknown as string
    this.isSaved = this.localStorageService.isEventSaved(eventId)

    this.subscriptions.add(
      this.localStorageService.savedEvents$.subscribe(() => {
        this.isSaved = this.localStorageService.isEventSaved(eventId)
      })
    )
  }

  private async initializeEventDetails(): Promise<void> {
    if (!this.event) return

    try {
      // Verwende Promise.all für parallele Ausführung
      const [location, eventType, mediaUrl] = await Promise.all([
        this.loadLocation(),
        this.loadEventType(),
        this.loadMedia(),
      ])

      // Batch-Update der Komponenten-Properties für weniger Change Detection Zyklen
      setTimeout(() => {
        this.location = location
        this.eventType = eventType
        this.mediaUrl = mediaUrl
      }, 0)
    } catch (error) {
      console.error('Fehler beim Laden der Event-Details:', error)
      this.mediaUrl = null
    }
  }

  private async loadLocation(): Promise<Location | null> {
    if (!this.event?.location) return null

    try {
      return await this.locationService.getLocationByID(this.event.location)
    } catch (error) {
      console.warn('Fehler beim Laden der Location:', error)
      return null
    }
  }

  private async loadEventType(): Promise<EventType | null> {
    if (!this.event?.event_type) return null

    try {
      const typeRecord = this.event.event_type
      const typeId = typeRecord.tb + ':' + typeRecord.id
      const result = await this.surrealDBService.getById<{ name: string }>(
        typeId,
      )
      return (result?.name as EventType) || EventType.UNKNOWN
    } catch (error) {
      console.warn('Fehler beim Laden des Event Types:', error)
      return EventType.UNKNOWN
    }
  }

  private async loadMedia(): Promise<string | null> {
    if (!this.event?.media || this.event.media.length === 0) return null
    return await this.mediaService.getFirstMediaUrl(this.event.media)
  }

  onCardClick(): void {
    if (!this.event) {
      this.router.navigate(['/kategorie'], { scrollPositionRestoration: 'top' })
      return
    }

    const cleanedId = this.event.id!.id
    this.router.navigate(['/event', cleanedId], { scrollPositionRestoration: 'top' })
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
    
    // Referenzen freigeben
    this.event = null
    this.location = null
    this.eventType = null
    this.mediaUrl = null
  }
}
