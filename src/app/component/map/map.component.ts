import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  NgZone,
  inject,
} from '@angular/core'

// Lazy-Loading für Leaflet
import type { Map } from 'leaflet'

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map?: Map
  private L?: typeof import('leaflet')
  private leafletLoaded = false

  @Input() coordinates!: [number, number]

  private readonly ngZone: NgZone = inject(NgZone)

  ngAfterViewInit(): void {
    // Dynamisches Importieren von Leaflet
    this.loadLeaflet()
  }

  private loadLeaflet(): void {
    try {
      // Importiere Leaflet außerhalb der Angular Zone für bessere Performance
      this.ngZone.runOutsideAngular(() => {
        // Verwende dynamischen Import mit Prefetch-Hint
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        document.head.appendChild(link)

        import('leaflet')
          .then((L) => {
            // Wichtig: Wir müssen das default-Objekt verwenden, da Leaflet als CommonJS-Modul importiert wird
            this.L = L.default
            this.leafletLoaded = true

            // Verwende requestAnimationFrame statt setTimeout für bessere Performance
            requestAnimationFrame(() => {
              this.initializeMap()
            })
          })
          .catch((error) => {
            console.error('Fehler beim Laden von Leaflet:', error)
          })
      })
    } catch (error) {
      console.error('Fehler beim Laden von Leaflet:', error)
    }
  }

  ngOnDestroy(): void {
    // Aufräumen, wenn die Komponente zerstört wird
    if (this.map) {
      this.map.remove()
      this.map = undefined
    }
    // Referenzen freigeben
    this.L = undefined
  }

  private initializeMap(): void {
    if (!this.L || !this.leafletLoaded) return

    try {
      // Karte erstellen mit Startkoordinaten und Zoom-Stufe
      this.map = this.L.map('map', {
        center: this.coordinates.slice() as [number, number],
        zoom: 18,
        scrollWheelZoom: true, // Maus-Rad-Zoom erlauben
        // Reduziere die Anzahl der DOM-Updates
        preferCanvas: true,
        // Deaktiviere Animationen für bessere Performance
        fadeAnimation: false,
        markerZoomAnimation: false,
        zoomAnimation: false,
        // Weitere Performance-Optimierungen
        trackResize: false, // Manuelles Resize-Handling wenn nötig
        renderer: new this.L.Canvas(), // Canvas statt SVG für bessere Performance
        attributionControl: false, // Entferne Attribution Control für weniger DOM-Elemente
      })

      // Optimiere Marker-Icon - Verwende eine statische URL für bessere Caching-Möglichkeiten
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

      // Marker hinzufügen ohne slice() für weniger Objektkopien
      this.L.marker(this.coordinates as [number, number], {
        icon: greenIcon,
      }).addTo(this.map)

      // OpenStreetMap-Kachel-Layer hinzufügen mit erweiterten Optimierungen
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 20,
        // Reduziere die Anzahl der geladenen Kacheln
        updateWhenIdle: true,
        updateWhenZooming: false,
        // Weitere Optimierungen
        tileSize: 256,
        zoomOffset: 0,
        minZoom: 1,
        detectRetina: false, // Deaktiviere Retina-Erkennung für weniger Kachel-Downloads
      }).addTo(this.map)
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Karte:', error)
    }
  }
}
