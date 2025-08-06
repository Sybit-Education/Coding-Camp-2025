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
  UNKNOWN = ''
}

export interface Event extends Record<string, unknown> {
  id: string
  name: string
  description: string
  location: {
    id: string
    tb: string
  }
  date_start: string
  date_end: string
  price: number
  organizer: {
    id: string
    tb: string
  }
  media: {
    id: string
    tb: string
  }[]
  type: EventType
}

export interface GeoPoint {
  type: 'Point'
  longLat: [number, number] // [longitude, latitude]
}
