import { RecordId } from "surrealdb";

export interface Organizer{
    id?: RecordId<'organizer'>
    name: string
    email?: string
    phonenumber?: number
}