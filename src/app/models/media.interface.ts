import { RecordId } from 'surrealdb'

export interface Media extends Record<string, unknown> {
  id?: RecordId<'media'>
  file?: string
  copyright?: string
  creator?: string
  fileName?: string
  fileType?: string
}
