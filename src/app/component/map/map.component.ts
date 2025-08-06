import { AfterViewInit, Component, Input } from '@angular/core'
import * as L from 'leaflet'

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map

  @Input() coordinates!: [number, number]

  ngAfterViewInit(): void {
    // Karte erstellen mit Startkoordinaten und Zoom-Stufe
    this.map = L.map('map', {
      center: this.coordinates.slice() as [number, number],
      zoom: 18,
      scrollWheelZoom: true, // Maus-Rad-Zoom erlauben
    })
    L.marker(this.coordinates.slice() as [number, number]).addTo(this.map)

    // OpenStreetMap-Kachel-Layer hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(this.map)
  }
}
