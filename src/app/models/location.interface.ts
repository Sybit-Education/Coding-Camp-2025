import { GeometryPoint, RecordId } from "surrealdb"

export interface Location {
  id?: RecordId<'location'>
  name: string
  street?: string
  zip_code?: string
  city?: string
  geo_point?: GeometryPoint
}