import { RecordId } from 'surrealdb'

export interface Media extends Record<string, unknown> {
  id?: RecordId<'media'>
  copyright?: string
  creator?: string
  fileName?: string
  fileType?: string
}
