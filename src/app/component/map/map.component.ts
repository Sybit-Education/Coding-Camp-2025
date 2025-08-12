import { AfterViewInit, Component, Input, OnDestroy, NgZone } from '@angular/core'
import { CommonModule } from '@angular/common'

// Lazy-Loading für Leaflet
import type { Map, Icon, TileLayer, Marker } from 'leaflet'

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  standalone: true,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map?: Map
  private L?: typeof import('leaflet')
  private leafletLoaded = false;

  @Input() coordinates!: [number, number]

  constructor(private readonly ngZone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    // Dynamisches Importieren von Leaflet
    try {
      // Importiere Leaflet außerhalb der Angular Zone für bessere Performance
      this.ngZone.runOutsideAngular(async () => {
        const L = await import('leaflet')
        // Wichtig: Wir müssen das default-Objekt verwenden, da Leaflet als CommonJS-Modul importiert wird
        this.L = L.default
        this.leafletLoaded = true

        // Warten bis DOM vollständig geladen ist
        setTimeout(() => {
          this.initializeMap()
        }, 0)
      });
    } catch (error) {
      console.error('Fehler beim Laden von Leaflet:', error)
    }
  }

  ngOnDestroy(): void {
    // Aufräumen, wenn die Komponente zerstört wird
    if (this.map) {
      this.map.remove()
    }
  }

  private initializeMap(): void {
    if (!this.L || !this.leafletLoaded) return;

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
        zoomAnimation: false
      });

      // Optimiere Marker-Icon
      const greenIcon = new this.L.Icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      this.L.marker(this.coordinates.slice() as [number, number], {
        icon: greenIcon,
      }).addTo(this.map);

      // OpenStreetMap-Kachel-Layer hinzufügen mit Optimierungen
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 20,
        // Reduziere die Anzahl der geladenen Kacheln
        updateWhenIdle: true,
        updateWhenZooming: false
      }).addTo(this.map);
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Karte:', error);
    }
  }
}
