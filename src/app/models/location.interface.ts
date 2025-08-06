
import { GeometryPoint, RecordId } from 'surrealdb'
export interface Location extends Record<string, unknown> {
  id?: RecordId<'location'>
  name: string
  street?: string
  zip_code?: number
  city?: string
  geo_point?: GeometryPoint
}
