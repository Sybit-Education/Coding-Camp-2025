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

    const greenIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.marker(this.coordinates.slice() as [number, number], {icon: greenIcon}).addTo(this.map)

    // OpenStreetMap-Kachel-Layer hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(this.map)
  }
}
