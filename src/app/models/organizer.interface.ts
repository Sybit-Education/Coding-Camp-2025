import { RecordId } from "surrealdb"

export interface Organizer extends Record<string, unknown> {
  id?: RecordId<'organizer'>
  name: string
  email?: string
  phonenumber?: string
}
