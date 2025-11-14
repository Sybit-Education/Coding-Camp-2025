import { RecordId } from 'surrealdb'

export interface Topic extends Record<string, unknown> {
  id?: RecordId<'topic'>
  name: string
  color: string
  slug: string
  description?: string
  media?: RecordId<'media'>
}
