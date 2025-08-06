import { Injectable } from '@angular/core'
import Surreal, { StringRecordId } from 'surrealdb'
import { environment } from '../../environments/environment.production'

@Injectable({
  providedIn: 'root',
})
export class SurrealdbService extends Surreal {

  constructor() {
    super()
  }

  async initialize() {
    await this.connect(environment.surrealDbAddress, {
      namespace: environment.surrealDbNamespace,
      database: environment.surrealDbDatabase,
    })
    await this.ready
  }

  // 1) Einen Eintrag nach ID holen
  async getById<T extends Record<string, unknown>>(
    recordId: string
  ): Promise<T> {
    const result = await super.select<T>(new StringRecordId(recordId))
    return result as T
  }

  // 2) Alle Einträge einer Tabelle holen
  async getAll<T extends Record<string, unknown>>(
  table: string
): Promise<T[]> {
  return await super.select<T>(table);
}

  // 3) Einfügen und die neuen Datensätze zurückbekommen
  async post<T extends Record<string, unknown>>(
    table: string,
    payload?: T | T[]
  ): Promise<T[]> {
    return await super.insert<T>(table, payload);
  }
}
