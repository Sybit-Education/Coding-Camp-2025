import { Decimal, RecordId } from 'surrealdb'

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
  UNKNOWN = '',
}

export interface Event extends Record<string, unknown> {
  id?: RecordId<'event'>
  name: string
  date_end?: Date
  date_start: Date
  description?: string
  more_infos_link?: string
  price?: Decimal
  age?: number
  restriction?: string
  draft: boolean
  organizer?: RecordId<'organizer'>
  event_type?: RecordId<'event_type'>
  location?: RecordId<'location'>
  topic?: RecordId<'topic'>[]
  media: RecordId<'media'>[]
  weehlchair?: boolean
  seeing?: boolean
  hearing?: boolean
}

export interface GeoPoint {
  type: 'Point'
  longLat: [number, number] // [longitude, latitude]
}
