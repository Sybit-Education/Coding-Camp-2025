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
  PLATFORM_ID,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

// Lazy-Loading für Leaflet
import type { Map, MapOptions, Marker } from 'leaflet'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map?: Map
  private L?: typeof import('leaflet')
  private leafletLoaded = false
  private marker?: Marker

  @Output() coordinatesChange = new EventEmitter<[number, number]>()
  private clickHandler?: (e: unknown) => void

  @Input() coordinates!: [number, number] | null
  @Input() addLocation = false

  // Optional: emit selected location (wird beim Klick und beim Drag emitted)
  @Output() locationSelected = new EventEmitter<[number, number]>()

  private readonly ngZone: NgZone = inject(NgZone)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly isBrowser = isPlatformBrowser(this.platformId)

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return
    }

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
          this.L =
            (Lmod as unknown as { default?: typeof import('leaflet') })
              .default ?? Lmod
          this.leafletLoaded = true
          requestAnimationFrame(() => {
            if (this.addLocation) {
              this.initializeMapForAddLocation()
            } else {
              this.initializeMapForShowLocation()
            }
            // Karte neu zeichnen, um sicherzustellen, dass sie die richtige Größe hat
            this.invalidateSize();
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
        ...this.getCommonMapOptions(),
        center: [
          (this.coordinates ? this.coordinates[1] : 47.75),
          (this.coordinates ? this.coordinates[0] : 8.97)
        ],
        zoom: 18,
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
        // Leaflet erwartet [lat, lng], wir haben [lng, lat]
        this.marker = this.L.marker([this.coordinates[1], this.coordinates[0]], {
          icon: greenIcon,
          draggable: true, // Marker ist verschiebbar
        }).addTo(this.map)
        
        // Wenn der Marker per Drag verschoben wird, emitte die neuen Koordinaten
        this.marker.on('dragend', (ev: unknown) => {
          const pos = (
            ev as { target: { getLatLng(): { lat: number; lng: number } } }
          ).target.getLatLng()
          // Angular informieren (Event + Change Detection falls nötig)
          this.ngZone.run(() => {
            this.coordinatesChange.emit([pos.lng, pos.lat])
          })
        })
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

      // Klick-Event hinzufügen
      this.map.on('click', (e) => {
        const { lat, lng } = e.latlng
        const newCoords: [number, number] = [lng, lat] // Leaflet gibt [lat, lng] zurück, wir brauchen [lng, lat]

        // Marker aktualisieren oder erstellen
        if (this.marker && this.map) {
          this.marker.setLatLng([lat, lng])
        } else if (this.map) {
          const greenIcon = new this.L!.Icon({
            iconUrl:
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })
          
          this.marker = this.L!.marker([lat, lng], {
            icon: greenIcon,
            draggable: true,
          }).addTo(this.map)
          
          // Wenn der Marker per Drag verschoben wird, emitte die neuen Koordinaten
          this.marker.on('dragend', (ev: unknown) => {
            const pos = (
              ev as { target: { getLatLng(): { lat: number; lng: number } } }
            ).target.getLatLng()
            // Angular informieren (Event + Change Detection falls nötig)
            this.ngZone.run(() => {
              this.coordinatesChange.emit([pos.lng, pos.lat])
            })
          })
        }

        // Koordinaten zurück an die Parent-Komponente senden
        this.ngZone.run(() => {
          this.coordinatesChange.emit(newCoords)
        })
      })
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
      // Leaflet erwartet [lat, lng], wir haben [lng, lat]
      const lat = this.coordinates ? this.coordinates[1] : 47.75;
      const lng = this.coordinates ? this.coordinates[0] : 8.97;

      this.map = this.L.map('map', {
        ...this.getCommonMapOptions(),
        center: [lat, lng],
        zoom: 12,
        maxBounds: this.L.latLngBounds(
          this.L.latLng(47.713, 8.868),
          this.L.latLng(47.797, 9.077),
        ),
      })

      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        updateWhenIdle: true,
        updateWhenZooming: false,
        tileSize: 256,
        zoomOffset: 0,
        minZoom: 12,
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

      // Wenn wir bereits Koordinaten haben, setze den Marker sofort
      if (this.coordinates) {
        this.marker = this.L.marker([lat, lng], {
          icon,
          draggable: true,
        }).addTo(this.map);

        // Wenn der Marker per Drag verschoben wird, emitte die neuen Koordinaten
        this.marker.on('dragend', (ev: unknown) => {
          const pos = (
            ev as { target: { getLatLng(): { lat: number; lng: number } } }
          ).target.getLatLng();
          // Angular informieren (Event + Change Detection falls nötig)
          this.ngZone.run(() => {
            this.coordinatesChange.emit([pos.lng, pos.lat]);
            this.locationSelected.emit([pos.lng, pos.lat]);
          });
        });
      }

      // Klick-Handler: erstelle Marker beim ersten Klick, setze / verschiebe ihn danach
      this.clickHandler = (e: unknown) => {
        // e.latlng ist das Ergebnis von Leaflet -> benutze es direkt
        const latlng = (e as { latlng: { lat: number; lng: number } }).latlng
        console.log(latlng)
        if (!this.marker) {
          this.marker = this.L!.marker([latlng.lat, latlng.lng], {
            icon,
            draggable: true,
          }).addTo(this.map!)

          // Wenn der Marker per Drag verschoben wird, emitte die neuen Koordinaten
          this.marker.on('dragend', (ev: unknown) => {
            const pos = (
              ev as { target: { getLatLng(): { lat: number; lng: number } } }
            ).target.getLatLng()
            // Angular informieren (Event + Change Detection falls nötig)
            this.ngZone.run(() => {
              this.coordinatesChange.emit([pos.lng, pos.lat])
              this.locationSelected.emit([pos.lng, pos.lat])
            })
          })
        } else {
          // verschiebe existierenden Marker
          this.marker.setLatLng([latlng.lat, latlng.lng])
        }

        // Emit initial/aktuellen Wert an die App (innerhalb der Angular zone)
        this.ngZone.run(() => {
          this.coordinatesChange.emit([latlng.lng, latlng.lat])
          this.locationSelected.emit([latlng.lng, latlng.lat])
        })
      }

      // Registriere Handler (Arrow-Funktion vermeidet falsches this)
      this.map.on('click', this.clickHandler)
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Karte (Add):', error)
    }
  }

  private getCommonMapOptions(): Partial<MapOptions> {
    return {
      minZoom: 12,
      maxZoom: 19,
      scrollWheelZoom: true,
      preferCanvas: true,
      fadeAnimation: false,
      markerZoomAnimation: false,
      zoomAnimation: false,
      trackResize: true, // Auf true setzen, damit die Karte auf Größenänderungen reagiert
      renderer: new this.L!.Canvas(),
      attributionControl: false,
    }
  }

  // Hilfsmethode, um die Karte neu zu zeichnen, wenn der Container seine Größe ändert
  private invalidateSize(): void {
    if (this.map) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    }
  }
}
