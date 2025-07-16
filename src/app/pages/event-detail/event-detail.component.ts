import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { Event, EventType } from '../../models/event.interface'
import { SaveEventButtonComponent } from '../../component/save-event-button/save-event-button.component'
import { MapComponent } from '../../component/map/map.component'

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [CommonModule, SaveEventButtonComponent, MapComponent],
  templateUrl: './event-detail.component.html',
})
export class EventDetailPageComponent implements OnInit {
  event: Event | null = null
  loading = true
  error: string | null = null

  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id')
    if (eventId) {
      this.loadEvent(eventId)
    } else {
      this.error = 'Event ID nicht gefunden'
      this.loading = false
    }
  }

  private async loadEvent(eventId: string) {
    try {
      this.loading = true

      // Mock Events (wie im Karussell)
      const mockEvents = this.getMockEvents()
      const foundEvent = mockEvents.find((e) => e.id === eventId)

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

  private getMockEvents(): Event[] {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return [
      {
        id: '1',
        title: 'Stadtführung durch das historische Radolfzell',
        date_start: yesterday.toISOString(),
        date_end: yesterday.toISOString(),
        location: {
          name: 'Marktplatz Radolfzell',
          street: 'Marktplatz 1',
          city: 'Radolfzell',
          coordinates: {
            type: 'Point',
            longLat: [47.741863, 8.973515],
          },
        },
        type: EventType.FUEHRUNG,
        description:
          'Entdecken Sie die 1200-jährige Geschichte der Stadt Radolfzell bei einer geführten Tour durch die historische Altstadt. Erfahren Sie mehr über bedeutende Gebäude, historische Ereignisse und das kulturelle Erbe der Stadt.',
        price: '15€ / Ermäßigt 10€',
        organizer: 'Tourist-Information Radolfzell',
        image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
      },
      {
        id: '2',
        title: 'Traditionelles Handwerker-Festival',
        date_start: yesterday.toISOString(),
        date_end: yesterday.toISOString(),
        location: {
          name: 'Altstadt',
          street: 'Hauptstraße',
          city: 'Radolfzell',
          coordinates: {
            type: 'Point',
            longLat: [47.741863, 8.973515],
          },
        },
        type: EventType.FESTIVAL,
        description:
          'Erleben Sie alte Handwerkskünste live! Schmiede, Töpfer, Weber und andere Handwerker zeigen ihr traditionelles Können. Für Familien mit Kindern gibt es Mitmach-Aktionen.',
        price: 'Eintritt frei',
        organizer: 'Handwerkergilde Radolfzell e.V.',
        image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
      },
      {
        id: '3',
        title: 'Jubiläums-Konzert am Bodensee',
        date_start: today.toISOString(),
        date_end: today.toISOString(),
        location: {
          name: 'Konzertmuschel',
          street: 'Seestraße 5',
          city: 'Radolfzell',
          coordinates: {
            type: 'Point',
            longLat: [47.741863, 8.973515],
          },
        },
        type: EventType.KONZERT,
        description:
          'Festkonzert zum 1200-jährigen Jubiläum mit dem Bodensee-Philharmonie-Orchester. Ein musikalisches Highlight mit klassischen und modernen Stücken vor der wunderschönen Kulisse des Bodensees.',
        price: '25€ / VVK 20€',
        organizer: 'Bodensee-Philharmonie',
        image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
      },
      {
        id: '4',
        title: 'Bodensee-Schifffahrt historisch',
        date_start: today.toISOString(),
        date_end: today.toISOString(),
        location: {
          name: 'Hafen Radolfzell',
          street: 'Hafenstraße 1',
          city: 'Radolfzell',
          coordinates: {
            type: 'Point',
            longLat: [47.741863, 8.973515],
          },
        },
        type: EventType.SCHIFFFAHRT,
        description:
          'Historische Rundfahrt auf dem Bodensee mit einem authentisch restaurierten Dampfschiff. Genießen Sie die Aussicht und lernen Sie die maritime Geschichte der Region kennen.',
        price: '30€ / Kinder 15€',
        organizer: 'BSB Bodensee-Schiffsbetriebe GmbH',
        image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
      },
      {
        id: '5',
        title: 'Mittelaltermarkt',
        date_start: today.toISOString(),
        date_end: today.toISOString(),
        location: {
          name: 'Münsterplatz',
          street: 'Münsterplatz 2',
          city: 'Radolfzell',
          coordinates: {
            type: 'Point',
            longLat: [47.741863, 8.973515],
          },
        },
        type: EventType.MARKT,
        description:
          'Mittelalterliches Treiben mit Gauklern, Rittern und Musikanten. Probieren Sie mittelalterliche Speisen und bestaunen Sie historische Handwerkskunst auf dem authentischen Mittelaltermarkt.',
        price: 'Kostenlos',
        organizer: 'Mittelalterverein "Ritter von Radolfzell"',
        image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
      },
      {
        id: '6',
        title: 'Festumzug 1200 Jahre Radolfzell',
        date_start: tomorrow.toISOString(),
        date_end: tomorrow.toISOString(),
        location: {
          name: 'Innenstadt',
          street: 'Marktplatz',
          city: 'Radolfzell',
          coordinates: {
            type: 'Point',
            longLat: [47.741863, 8.973515],
          },
        },
        type: EventType.UMZUG,
        description:
          'Großer Festumzug durch die Stadt mit über 50 Vereinen, Gruppen und historischen Darstellungen. Ein spektakuläres Ereignis, das die Geschichte und Kultur von Radolfzell feiert.',
        price: 'Freier Eintritt',
        organizer: 'Stadt Radolfzell - Kulturbüro',
        image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
      },
      {
        id: '7',
        title: 'Feuerwerk über dem Bodensee',
        date_start: tomorrow.toISOString(),
        date_end: tomorrow.toISOString(),
        location: {
          name: 'Seeufer',
          street: 'Uferpromenade',
          city: 'Radolfzell',
          coordinates: {
            type: 'Point',
            longLat: [47.741863, 8.973515],
          },
        },
        type: EventType.FEUERWERK,
        description:
          'Spektakuläres Jubiläums-Feuerwerk über dem Bodensee. Ein unvergessliches Erlebnis mit Musik und pyrotechnischen Effekten, das den Höhepunkt der Jubiläumsfeierlichkeiten bildet.',
        price: 'Spende erbeten',
        organizer: 'Stadt Radolfzell',
        image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
      },
    ]
  }

  goBack() {
    this.router.navigate(['/'])
  }
}
