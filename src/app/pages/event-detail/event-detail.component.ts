import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core'
import { injectMarkForCheck } from '@app/utils/zoneless-helpers'
import { Subscription } from 'rxjs'
import { MapComponent } from '../../component/map/map.component'
import { Event } from '../../models/event.interface'
import { Location } from '../../models/location.interface'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { CommonModule, DOCUMENT } from '@angular/common'
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
import { CalendarExportComponent } from '@app/component/calendar-export/calendar-export.component'
import { ScreenSize } from '@app/models/screenSize.enum'
import { SharedStateService } from '@app/services/shared-state.service'
import { EventImageComponent } from '@app/component/event-image/event-image.component'
import { MatIconModule } from '@angular/material/icon'
import { IconComponent } from '@app/component/icon/icon.component'
import { GoBackComponent } from '@app/component/go-back-button/go-back-button.component'
import { EventTypePillComponent } from '@app/component/event-type-pill/event-type-pill.component'
import { EventTopicPillListComponent } from '@app/component/event-topic-pill-list/event-topic-pill-list.component'
import { EventCardListComponent } from '@app/component/event-card-list/event-card-list.component'
import { SeoService } from '@app/services/seo.service'

@Component({
  selector: 'app-event-detail-page',
  imports: [
    CommonModule,
    TranslateModule,
    MapComponent,
    DateTimeRangePipe,
    FavoriteButtonComponent,
    ShareComponent,
    EventImageComponent,
    CalendarExportComponent,
    MatIconModule,
    IconComponent,
    EventTypePillComponent,
    EventTopicPillListComponent,
    GoBackComponent,
    EventCardListComponent,
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
  goBackSite: string | string[] = '/'
  goBackParams?: string | null = null

  mediaList: { url: string; copyright: string; creator: string }[] = []

  protected isLoggedIn = false
  screenSize = ScreenSize

  eventsFound = true

  private readonly eventService = inject(EventService)
  private readonly locationService = inject(LocationService)
  private readonly organizerService = inject(OrganizerService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly loginservice = inject(LoginService)
  private readonly mediaService = inject(MediaService)
  private readonly markForCheck = injectMarkForCheck()
  private readonly seo = inject(SeoService)
  private readonly document = inject(DOCUMENT)
  readonly sharedStateService = inject(SharedStateService)

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.eventId = params.get('id') || ''
    })

    this.route.queryParamMap.subscribe((params) => {
      const filterQueryParam = params.get('filterQuery')
      this.goBackParams = filterQueryParam || null

      console.log('Query Params:', filterQueryParam)
    })
    if (this.eventId) {
      const recordID = new StringRecordId('event:' + this.eventId)
      this.loadEvent(recordID)
    } else {
      this.error = 'Event ID nicht gefunden'
      this.announceError('Event ID nicht gefunden')
    }

    console.log('Go back params:', this.goBackParams)
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
      const foundLocation = await this.locationService.getLocationByID(locationId)

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
      const foundOrganizer = await this.organizerService.getOrganizerByID(organizerId)

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
      let mediaPromise: Promise<{ url: string; copyright: string; creator: string }[]> = Promise.resolve([])

      if (foundEvent.media?.length > 0) {
        mediaPromise = Promise.all(
          foundEvent.media.map(async (mediaId) => {
            const media = await this.mediaService.getMediaById(mediaId)
            const url = this.mediaService.getMediaUrl(media.id)
            return {
              url: url || '',
              copyright: media.copyright || '',
              creator: media.creator || '',
            }
          }),
        )
        promises.push(mediaPromise)
      }

      // Extrahiere IDs für parallele Ladung
      const locationId = this.event?.['location']
      const organizerId = this.event?.['organizer']
      const typeId = this.event?.['event_type']

      // Lade alle abhängigen Daten parallel
      const locationPromise = locationId ? this.loadLocation(locationId) : Promise.resolve(null)
      const organizerPromise = organizerId ? this.loadOrganizer(organizerId) : Promise.resolve(null)
      const typePromise = typeId ? this.loadType(typeId) : Promise.resolve(null)

      promises.push(locationPromise, organizerPromise, typePromise)

      // Warte auf alle Promises
      await Promise.all(promises)

      // Batch-Update für weniger Change Detection Zyklen
      requestAnimationFrame(async () => {
        const [mediaResults, location, organizer, type] = await Promise.all([
          mediaPromise,
          locationPromise,
          organizerPromise,
          typePromise,
        ])

        if (mediaResults.length > 0) {
          this.mediaList = mediaResults.map((m) => ({
            url: m.url,
            copyright: m.copyright,
            creator: m.creator,
          }))
        }

        this.location = location
        this.organizer = organizer
        this.type = type

        const url = this.getEventUrl()
        const toDate = (d?: Date) => (d ? new Date(d) : null)
        const startDate = toDate(this.event!.date_start)
        const endDate = toDate(this.event!.date_end)
        const locale = navigator.language || 'de-DE'
        let dateText = ''
        if (startDate) {
          const opts: Intl.DateTimeFormatOptions = { dateStyle: 'full', timeStyle: 'short' }
          dateText = new Intl.DateTimeFormat(locale, opts).format(startDate)
          if (endDate && endDate.getTime() !== startDate.getTime()) {
            const endText = new Intl.DateTimeFormat(locale, opts).format(endDate)
            dateText = `${dateText} – ${endText}`
          }
        }
        const descriptionParts: string[] = []
        if (dateText) descriptionParts.push(dateText)
        if (this.location?.name) descriptionParts.push(this.location.name)
        const description = descriptionParts.join(' • ') || this.event!.description || this.event!.name

        this.seo.setSocialMeta(this.event!.name, description, url, this.mediaList[0]?.url, 'website')
        this.setStructuredData(this.event!, this.mediaList[0]?.url)
        this.markForCheck()
      })
    } catch (err) {
      this.error = `Fehler beim Laden: ${err}`
      this.announceError(`Fehler beim Laden: ${err}`)
    }
  }

  editEvent() {
    this.router.navigate(['/admin/event', String(this.event!.id)])
  }

  startRoute() {
    const lat = this.location!.geo_point!.coordinates[1]
    const lng = this.location!.geo_point!.coordinates[0]

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

    window.open(url, '_blank')
  }

  /**
   * Generiert die Event-URL für die aktuelle Veranstaltung
   * Wird für die Meta-Tags verwendet
   */
  getEventUrl(): string {
    if (!this.event?.id) return window.location.href

    const id = this.event.id.id || ''
    const baseUrl = window.location.origin
    return `${baseUrl}/event/${id}`
  }


  /**
   * Fügt strukturierte Daten (Schema.org/JSON-LD) für Events hinzu,
   * damit Suchmaschinen und Social Crawler die Veranstaltung besser verstehen.
   */
  private setStructuredData(event: Event, imageUrl?: string): void {
    const scriptId = 'ld-json-event'
    const existing = this.document.getElementById(scriptId)
    if (existing?.parentNode) {
      existing.parentNode.removeChild(existing)
    }

    const url = this.getEventUrl()
    const startDate = event.date_start ? new Date(event.date_start) : null
    const endDate = event.date_end ? new Date(event.date_end) : null

    const data: {
      '@context': 'https://schema.org'
      '@type': 'Event'
      name: string
      url: string
      eventStatus: string
      eventAttendanceMode: string
      description?: string
      startDate?: string
      endDate?: string
      image?: string[]
      location?: {
        '@type': 'Place'
        name: string
        address: {
          '@type': 'PostalAddress'
          streetAddress?: string
          postalCode?: string
          addressLocality: string
          addressCountry: string
        }
        geo?: {
          '@type': 'GeoCoordinates'
          latitude: number
          longitude: number
        }
      }
      organizer?: {
        '@type': 'Organization'
        name: string
        email?: string
        telephone?: string
      }
      offers?: {
        '@type': 'Offer'
        price: string
        priceCurrency: string
        availability: string
      }
    } = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.name,
      url,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    }

    if (event.description) data.description = event.description
    if (startDate) data.startDate = startDate.toISOString()
    if (endDate) data.endDate = endDate.toISOString()
    if (imageUrl) data.image = [imageUrl]

    if (this.location) {
      const latitude = this.location.geo_point?.coordinates?.[1]
      const longitude = this.location.geo_point?.coordinates?.[0]
      data.location = {
        '@type': 'Place',
        name: this.location.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: this.location.street || undefined,
          postalCode: this.location.zip_code || undefined,
          addressLocality: this.location.city || 'Radolfzell',
          addressCountry: 'DE',
        },
      }
      if (latitude != null && longitude != null) {
        data.location.geo = {
          '@type': 'GeoCoordinates',
          latitude,
          longitude,
        }
      }
    }

    if (this.organizer) {
      data.organizer = {
        '@type': 'Organization',
        name: this.organizer.name,
        email: this.organizer.email || undefined,
        telephone: this.organizer.phonenumber || undefined,
      }
    }

    if (event.price != null) {
      data.offers = {
        '@type': 'Offer',
        price: String(event.price),
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      }
    }

    const script = this.document.createElement('script')
    script.type = 'application/ld+json'
    script.id = scriptId
    script.text = JSON.stringify(data)
    this.document.head.appendChild(script)
  }
}
