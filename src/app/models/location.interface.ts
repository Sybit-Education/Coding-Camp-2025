import { GeometryPoint, RecordId } from 'surrealdb'
import { Media } from './media.interface'

export interface Location extends Record<string, unknown> {
  id?: RecordId<'location'>
  name: string
  street?: string
  zip_code?: string
  city?: string
  geo_point?: GeometryPoint
  media?: Media[]
}
