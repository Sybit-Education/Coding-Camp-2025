import { RecordId } from "surrealdb";

export interface Media {
    id?: RecordId<'media'>
    file: string
    fileName: string
    fileType: string
}