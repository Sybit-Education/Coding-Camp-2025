export enum EventType {
  FUEHRUNG = 'Führung',
  FESTIVAL = 'Festival',
  KONZERT = 'Konzert',
  SCHIFFFAHRT = 'Schifffahrt',
  MARKT = 'Markt',
  UMZUG = 'Umzug',
  FEUERWERK = 'Feuerwerk',
  AUSSTELLUNG = 'Ausstellung',
  WORKSHOP = 'Workshop',
  TANZ = 'Tanz',
}

export interface Event {
  id: string
  title: string
  description: string
  location: {
    name: string
    street: string
    city: string
    coordinates?: GeoPoint
  }
  date_start: string
  date_end: string
  price: string
  organizer: string
  image: string
  type: EventType
}

export interface GeoPoint {
  type: 'Point'
  longLat: [number, number] // [longitude, latitude]
}
