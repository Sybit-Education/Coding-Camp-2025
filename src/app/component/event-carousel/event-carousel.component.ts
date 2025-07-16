import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { Event, EventType } from '../../models/event.interface'
import { EventCardComponent } from '../event-card/event-card.component'
import { LocalStorageService } from '../../services/local-storage.service'
import { Subscription } from 'rxjs'

interface CarouselCard {
  id: string
  title: string
  category: string
  color: string
  events: Event[]
}

@Component({
  selector: 'app-event-carousel',
  standalone: true,
  imports: [CommonModule, EventCardComponent],
  templateUrl: './event-carousel.component.html',
  styleUrl: './event-carousel.component.scss',
})
export class EventCarouselComponent implements OnInit, OnDestroy {
  events: Event[] = []
  allEvents: Event[] = []
  loading = true
  error: string | null = null
  selectedFilter = 'Alle'
  availableFilters: string[] = []
  @ViewChild('carousel', { static: false }) carousel!: ElementRef

  private savedEventsSubscription?: Subscription

  cards: CarouselCard[] = [
    {
      id: 'geschtern',
      title: 'Geschtern',
      category: 'Geschtern',
      color: 'bg-indigo',
      events: [],
    },
    {
      id: 'heit',
      title: 'Heit',
      category: 'Heit',
      color: 'bg-indigo',
      events: [],
    },
    {
      id: 'morge',
      title: 'Morge',
      category: 'Morge',
      color: 'bg-indigo',
      events: [],
    },
    {
      id: 'alle',
      title: 'Alle Events',
      category: 'Alle',
      color: 'bg-indigo',
      events: [],
    },
  ]

  currentIndex = 1
  isDragging = false
  startX = 0
  currentX = 0
  translateX = 0

  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadEvents()
    this.extractAvailableFilters()
    this.distributeEvents()
    setTimeout(() => this.updateCarouselPosition(), 0)

    this.savedEventsSubscription =
      this.localStorageService.savedEvents$.subscribe(() => {
        setTimeout(() => {
          this.extractAvailableFilters()
          this.cdr.detectChanges()
        }, 0)
      })
  }

  ngOnDestroy() {
    this.savedEventsSubscription?.unsubscribe()
  }

  private async loadEvents() {
    try {
      this.loading = true

      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Stadtführung durch das historische Radolfzell',
          date_start: yesterday.toISOString().split('T')[0],
          date_end: yesterday.toISOString().split('T')[0],
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
          description: 'Entdecken Sie die 1200-jährige Geschichte der Stadt',
          price: '15€ / Ermäßigt 10€',
          organizer: 'Tourist-Information Radolfzell',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '2',
          title: 'Traditionelles Handwerker-Festival',
          date_start: yesterday.toISOString().split('T')[0],
          date_end: yesterday.toISOString().split('T')[0],
          location: {
            name: 'Altstadt',
            street: 'Altstadt',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.FESTIVAL,
          description: 'Alte Handwerkskünste live erleben',
          price: 'Kostenlos',
          organizer: 'Handwerkergilde Radolfzell e.V.',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '3',
          title: 'Jubiläums-Konzert am Bodensee',
          date_start: today.toISOString().split('T')[0],
          date_end: today.toISOString().split('T')[0],
          location: {
            name: 'Konzertmuschel',
            street: 'Seestraße 10',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.KONZERT,
          description: 'Festkonzert zum 1200-jährigen Jubiläum',
          price: '25€ / VVK 20€',
          organizer: 'Bodensee-Philharmonie',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '4',
          title: 'Bodensee-Schifffahrt historisch',
          date_start: today.toISOString().split('T')[0],
          date_end: today.toISOString().split('T')[0],
          location: {
            name: 'Hafen Radolfzell',
            street: 'Hafenstraße 5',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.SCHIFFFAHRT,
          description: 'Historische Rundfahrt auf dem Bodensee',
          price: '30€ / Kinder 15€',
          organizer: 'BSB Bodensee-Schiffsbetriebe GmbH',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '5',
          title: 'Mittelaltermarkt',
          date_start: today.toISOString().split('T')[0],
          date_end: today.toISOString().split('T')[0],
          location: {
            name: 'Münsterplatz',
            street: 'Münsterplatz',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.MARKT,
          description: 'Mittelalterliches Treiben mit Gauklern und Rittern',
          price: 'Eintritt frei',
          organizer: 'Mittelalterverein "Ritter von Radolfzell"',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '6',
          title: 'Festumzug 1200 Jahre Radolfzell',
          date_start: tomorrow.toISOString().split('T')[0],
          date_end: tomorrow.toISOString().split('T')[0],
          location: {
            name: 'Innenstadt',
            street: 'Hauptstraße',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.UMZUG,
          description: 'Großer Festumzug durch die Stadt',
          price: 'Kostenlos',
          organizer: 'Stadt Radolfzell - Kulturbüro',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '7',
          title: 'Feuerwerk über dem Bodensee',
          date_start: tomorrow.toISOString().split('T')[0],
          date_end: tomorrow.toISOString().split('T')[0],
          location: {
            name: 'Seeufer',
            street: 'Seepromenade',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.FEUERWERK,
          description: 'Spektakuläres Jubiläums-Feuerwerk',
          price: 'Freier Eintritt',
          organizer: 'Stadt Radolfzell',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '8',
          title: 'Ausstellung: 1200 Jahre Stadtgeschichte',
          date_start: new Date('2025-07-01').toISOString().split('T')[0],
          date_end: new Date('2025-07-31').toISOString().split('T')[0],
          location: {
            name: 'Stadtmuseum',
            street: 'Museumstraße 2',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.AUSSTELLUNG,
          description: 'Dauerausstellung zur Stadtgeschichte',
          price: '8€ / Ermäßigt 5€ / Familien 20€',
          organizer: 'Stadtmuseum Radolfzell',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '9',
          title: 'Radolfzeller Sommer-Festival',
          date_start: new Date('2025-07-15').toISOString().split('T')[0],
          date_end: new Date('2025-07-17').toISOString().split('T')[0],
          location: {
            name: 'Mettnau',
            street: 'Mettnaustraße',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.FESTIVAL,
          description: 'Mehrtägiges Musik- und Kulturfestival',
          price: '45€ / 3-Tage-Pass 120€',
          organizer: 'Kulturverein Radolfzell e.V.',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '10',
          title: 'Jazz im Park',
          date_start: today.toISOString().split('T')[0],
          date_end: today.toISOString().split('T')[0],
          location: {
            name: 'Stadtpark',
            street: 'Parkstraße 8',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.KONZERT,
          description: 'Entspannte Jazz-Musik unter freiem Himmel',
          price: 'Spende erbeten',
          organizer: 'Jazz Club Bodensee e.V.',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '11',
          title: 'Handwerker-Workshop für Kinder',
          date_start: tomorrow.toISOString().split('T')[0],
          date_end: tomorrow.toISOString().split('T')[0],
          location: {
            name: 'Volkshochschule',
            street: 'Bildungsstraße 12',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.WORKSHOP,
          description: 'Kinder lernen traditionelle Handwerkstechniken',
          price: '10€ pro Kind (Material inkl.)',
          organizer: 'VHS Landkreis Konstanz',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
        {
          id: '12',
          title: 'Historischer Tanz-Abend',
          date_start: yesterday.toISOString().split('T')[0],
          date_end: yesterday.toISOString().split('T')[0],
          location: {
            name: 'Kulturzentrum',
            street: 'Kulturstraße 5',
            city: 'Radolfzell',
            coordinates: {
              type: 'Point',
              longLat: [47.741863, 8.973515],
            },
          },
          type: EventType.TANZ,
          description: 'Traditionelle Tänze aus verschiedenen Epochen',
          price: '20€ / Paare 35€',
          organizer: 'Tanzschule Bodensee-Eleganz',
          image: 'Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg',
        },
      ]

      this.events = mockEvents
      this.allEvents = [...mockEvents]
    } catch (err) {
      this.error = `Fehler beim Laden der Daten: ${err}`
    } finally {
      this.loading = false
    }
  }

  private distributeEvents() {
    this.cards.forEach((card) => (card.events = []))

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    this.events.forEach((event) => {
      const eventDate = this.parseEventDate(event.date_start)

      if (eventDate) {
        const eventDateOnly = new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate(),
        )
        const todayOnly = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        )
        const yesterdayOnly = new Date(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate(),
        )
        const tomorrowOnly = new Date(
          tomorrow.getFullYear(),
          tomorrow.getMonth(),
          tomorrow.getDate(),
        )

        if (eventDateOnly.getTime() === yesterdayOnly.getTime()) {
          this.cards[0].events.push(event)
        } else if (eventDateOnly.getTime() === todayOnly.getTime()) {
          this.cards[1].events.push(event)
        } else if (eventDateOnly.getTime() === tomorrowOnly.getTime()) {
          this.cards[2].events.push(event)
        }
      }
      this.cards[3].events.push(event)
    })
  }

  private parseEventDate(dateString?: string): Date | null {
    if (!dateString) return null

    try {
      const date = new Date(dateString)

      if (!isNaN(date.getTime())) {
        return date
      }

      const germanDateRegex = /(\d{1,2})\.(\d{1,2})\.(\d{4})/
      const match = dateString.match(germanDateRegex)

      if (match) {
        const day = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) - 1
        const year = parseInt(match[3], 10)
        return new Date(year, month, day)
      }

      return null
    } catch {
      return null
    }
  }

  onTouchStart(event: TouchEvent) {
    this.isDragging = true
    this.startX = event.touches[0].clientX
    this.currentX = this.startX
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return

    event.preventDefault()
    this.currentX = event.touches[0].clientX
    const deltaX = this.currentX - this.startX
    this.translateX = deltaX

    if (this.carousel) {
      this.carousel.nativeElement.style.transform = `translateX(calc(-${this.currentIndex * 100}% + ${deltaX}px))`
    }
  }

  onTouchEnd() {
    if (!this.isDragging) return

    const deltaX = this.currentX - this.startX
    const threshold = 100

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && this.currentIndex > 0) {
        this.goToPrevious()
      } else if (deltaX < 0 && this.currentIndex < this.cards.length - 1) {
        this.goToNext()
      } else {
        this.resetPosition()
      }
    } else {
      this.resetPosition()
    }

    this.isDragging = false
    this.translateX = 0
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true
    this.startX = event.clientX
    this.currentX = this.startX
    event.preventDefault()
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return

    this.currentX = event.clientX
    const deltaX = this.currentX - this.startX
    this.translateX = deltaX

    if (this.carousel) {
      this.carousel.nativeElement.style.transform = `translateX(calc(-${this.currentIndex * 100}% + ${deltaX}px))`
    }
  }

  onMouseUp() {
    if (!this.isDragging) return

    const deltaX = this.currentX - this.startX
    const threshold = 100

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && this.currentIndex > 0) {
        this.goToPrevious()
      } else if (deltaX < 0 && this.currentIndex < this.cards.length - 1) {
        this.goToNext()
      } else {
        this.resetPosition()
      }
    } else {
      this.resetPosition()
    }

    this.isDragging = false
    this.translateX = 0
  }

  goToNext() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++
      this.updateCarouselPosition()
    }
  }

  goToPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.updateCarouselPosition()
    }
  }

  goToSlide(index: number) {
    this.currentIndex = index
    this.updateCarouselPosition()
  }

  private updateCarouselPosition() {
    if (this.carousel) {
      this.carousel.nativeElement.style.transform = `translateX(-${this.currentIndex * 100}%)`
    }
  }

  private resetPosition() {
    if (this.carousel) {
      this.carousel.nativeElement.style.transform = `translateX(-${this.currentIndex * 100}%)`
    }
  }

  private extractAvailableFilters() {
    const uniqueEventTypes = new Set(['Alle', 'Gespeichert'])
    this.allEvents.forEach((event) => {
      if (event.type) {
        uniqueEventTypes.add(event.type)
      }
    })
    this.availableFilters = Array.from(uniqueEventTypes)
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter
    this.applyFilter()
    this.currentIndex = 1
    this.updateCarouselPosition()
  }

  private applyFilter() {
    if (this.selectedFilter === 'Alle') {
      this.events = [...this.allEvents]
    } else if (this.selectedFilter === 'Gespeichert') {
      this.events = this.localStorageService.filterSavedEvents(this.allEvents)
    } else {
      this.events = this.allEvents.filter(
        (event) => event.type === this.selectedFilter,
      )
    }
    this.distributeEvents()
  }

  getFilterButtonClass(filter: string): string {
    const count = this.getEventCountForFilter(filter)
    const baseClasses =
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border transform hover:scale-105 active:scale-95 shadow-sm'

    if (count === 0 && filter !== 'Alle') {
      return `${baseClasses} bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-50`
    }

    if (this.selectedFilter === filter) {
      return `${baseClasses} bg-indigo text-white border-indigo shadow-md shadow-indigo-500/20`
    } else {
      return `${baseClasses} bg-white text-indigo border-indigo-300 hover:bg-indigo-50 hover:border-indigo hover:shadow-md hover:shadow-indigo-500/15`
    }
  }

  getEventCountForFilter(filter: string): number {
    if (filter === 'Alle') {
      return this.allEvents.length
    }
    if (filter === 'Gespeichert') {
      const savedEvents = this.localStorageService.filterSavedEvents(
        this.allEvents,
      )
      return savedEvents.length
    }
    return this.allEvents.filter((event) => event.type === filter).length
  }

  getFilterDisplayText(filter: string): string {
    const count = this.getEventCountForFilter(filter)
    return `${filter} (${count})`
  }

  getFilterIcon(filter: string): string {
    const iconMap: Record<string, string> = {
      'Alle': '📅',
      'Gespeichert': '⭐',
      'Konzert': '🎵',
      'Festival': '🎪',
      'Führung': '🚶',
      'Markt': '🛍️',
      'Umzug': '🎭',
      'Feuerwerk': '🎆',
      'Schifffahrt': '⛵',
      'Ausstellung': '🖼️',
      'Workshop': '🔨',
      'Tanz': '💃',
    }
    return iconMap[filter] || '📅'
  }
}
