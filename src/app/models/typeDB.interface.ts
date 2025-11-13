import { RecordId } from 'surrealdb'
export interface TypeDB extends Record<string, unknown> {
  id: RecordId<'event_type'>
  name: string
  color: string
  description?: string
  slug: string
}
