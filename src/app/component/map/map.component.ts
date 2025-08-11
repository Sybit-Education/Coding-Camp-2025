import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core'
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

  @Input() coordinates!: [number, number]

  async ngAfterViewInit(): Promise<void> {
    // Dynamisches Importieren von Leaflet
    try {
      this.L = await import('leaflet')
      
      // Warten bis DOM vollständig geladen ist
      setTimeout(() => {
        this.initializeMap()
      }, 0)
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
    if (!this.L) return

    // Karte erstellen mit Startkoordinaten und Zoom-Stufe
    this.map = this.L.map('map', {
      center: this.coordinates.slice() as [number, number],
      zoom: 18,
      scrollWheelZoom: true, // Maus-Rad-Zoom erlauben
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

    this.L.marker(this.coordinates.slice() as [number, number], {
      icon: greenIcon,
    }).addTo(this.map)

    // OpenStreetMap-Kachel-Layer hinzufügen
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(this.map)
  }
}
