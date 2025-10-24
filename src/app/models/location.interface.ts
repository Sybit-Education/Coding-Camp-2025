import { RecordId } from 'surrealdb'
import { Media } from './media.interface'

// Define our own GeometryPoint interface to match SurrealDB's structure
export interface GeometryPoint {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

export interface Location extends Record<string, unknown> {
  id?: RecordId<'location'>
  name: string
  street?: string
  zip_code?: string
  city?: string
  geo_point?: GeometryPoint
  media?: Media[]
}
