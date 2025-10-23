import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  NgZone,
  Output,
  EventEmitter,
  inject,
} from '@angular/core'

// Leaflet types kept generic because we import dynamically
import type * as LeafletNS from 'leaflet'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map?: LeafletNS.Map
  private L?: typeof import('leaflet')
  private leafletLoaded = false
  private marker: any // use 'any' because Leaflet is dynamically imported
  private clickHandler?: (e: any) => void

  @Input() coordinates!: [number, number] | null
  @Input() addLocation = false

  // Optional: emit selected location (wird beim Klick und beim Drag emitted)
  @Output() locationSelected = new EventEmitter<[number, number]>()

  private readonly ngZone: NgZone = inject(NgZone)

  ngAfterViewInit(): void {
    // Ein dynamischer Import, danach initialisieren wir je nach Modus
    this.ngZone.runOutsideAngular(() => {
      // optional prefetch script hint (wie in deinem Code)
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      document.head.appendChild(link)

      import('leaflet')
        .then((Lmod) => {
          // Lmod.default falls CommonJS, sonst Lmod
          this.L = (Lmod as any).default ?? Lmod
          this.leafletLoaded = true
          requestAnimationFrame(() => {
            if (this.addLocation) {
              this.initializeMapForAddLocation()
            } else {
              this.initializeMapForShowLocation()
            }
          })
        })
        .catch((err) => console.error('Fehler beim Laden von Leaflet:', err))
    })
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off() // entferne event listeners
      this.map.remove()
    }
    this.L = undefined
    this.marker = undefined
    this.clickHandler = undefined
  }

  /* -----------------------------
     Show-Mode (zeige feste Location)
     ----------------------------- */
  private initializeMapForShowLocation(): void {
    if (!this.L || !this.leafletLoaded) return
    try {
      this.map = this.L.map('map', {
        center: (this.coordinates ?? [51, 9]).slice() as [number, number],
        zoom: 18,
        scrollWheelZoom: true,
        preferCanvas: true,
        fadeAnimation: false,
        markerZoomAnimation: false,
        zoomAnimation: false,
        trackResize: false,
        renderer: new this.L.Canvas(),
        attributionControl: false,
      })

      const greenIcon = new this.L.Icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

      if (this.coordinates) {
        this.L.marker(this.coordinates as [number, number], {
          icon: greenIcon,
        }).addTo(this.map)
      }

      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 20,
        updateWhenIdle: true,
        updateWhenZooming: false,
        tileSize: 256,
        zoomOffset: 0,
        minZoom: 3,
        detectRetina: false,
      }).addTo(this.map)
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Karte (Show):', error)
    }
  }

  /* -----------------------------
     Add-Mode (Marker per Klick)
     ----------------------------- */
  private initializeMapForAddLocation(): void {
    if (!this.L || !this.leafletLoaded) return
    try {
      // Center falls keine Koordinaten übergeben wurden
      const center = (this.coordinates ?? [47.75, 8.97]).slice() as [
        number,
        number,
      ]

      this.map = this.L.map('map', {
        center,
        zoom: 13,
        scrollWheelZoom: true,
        preferCanvas: true,
        fadeAnimation: false,
        markerZoomAnimation: false,
        zoomAnimation: false,
        trackResize: false,
        renderer: new this.L.Canvas(),
        attributionControl: false,
        maxBounds: this.L.latLngBounds(
          this.L.latLng(47.76, 8.942),
          this.L.latLng(47.733, 8.992),
        ),
      })

      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        updateWhenIdle: true,
        updateWhenZooming: false,
        tileSize: 256,
        zoomOffset: 0,
        minZoom: 13,
        detectRetina: false,
      }).addTo(this.map)

      // Icon optional
      const icon = new this.L.Icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

      // Klick-Handler: erstelle Marker beim ersten Klick, setze / verschiebe ihn danach
      this.clickHandler = (e: any) => {
        // e.latlng ist das Ergebnis von Leaflet -> benutze es direkt
        const latlng = e.latlng as { lat: number; lng: number }
        console.log(latlng)
        if (!this.marker) {
          this.marker = this.L!.marker([latlng.lat, latlng.lng], {
            icon,
            draggable: true,
          }).addTo(this.map!)

          // Wenn der Marker per Drag verschoben wird, emitte die neuen Koordinaten
          this.marker.on('dragend', (ev: any) => {
            const pos = ev.target.getLatLng()
            // Angular informieren (Event + Change Detection falls nötig)
            this.ngZone.run(() => {
              this.locationSelected.emit([pos.lng, pos.lat])
            })
          })
        } else {
          // verschiebe existierenden Marker
          this.marker.setLatLng([latlng.lat, latlng.lng])
        }

        // Emit initial/aktuellen Wert an die App (innerhalb der Angular zone)
        this.ngZone.run(() => {
          this.locationSelected.emit([latlng.lng, latlng.lat])
        })
      }

      // Registriere Handler (Arrow-Funktion vermeidet falsches this)
      this.map.on('click', this.clickHandler)
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Karte (Add):', error)
    }
  }
}
