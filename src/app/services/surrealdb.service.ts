import { Injectable } from '@angular/core'
import Surreal, { RecordId, StringRecordId, Token } from 'surrealdb'
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

  async login(username: string, password: string) {
    const jwtToken = await super.signin({
      namespace: environment.surrealDbNamespace,
      database: environment.surrealDbDatabase,
      access: 'user',
      variables: {
        username: username,
        password: password,
      },
    })
    return jwtToken
  }

  override async authenticate(token: Token): Promise<true> {
    return await super.authenticate(token)
  }

  // 1) Einen Eintrag nach ID holen
  // @deprecated Use `getByRecordId() instead!
  async getById<T extends Record<string, unknown>>(
    recordId: string,
  ): Promise<T> {
    console.log('📥 getById(): Fetching record with ID', recordId)
    const result = await super.select<T>(new StringRecordId(recordId))
    return result as T
  }

  async getByRecordId<T extends Record<string, unknown>>(recordId: RecordId<string> | StringRecordId): Promise<T> {
    const result = await super.select<T>(recordId)
    return result as T
  }

  // 2) Alle Einträge einer Tabelle holen
  async getAll<T extends Record<string, unknown>>(table: string): Promise<T[]> {
    return await super.select<T>(table)
  }

  // 3) Einfügen und die neuen Datensätze zurückbekommen
  async post<T extends Record<string, unknown>>(
    table: string,
    payload?: T | T[],
  ): Promise<T[]> {
    return await super.insert<T>(table, payload)
  }

  async postUpdate<T extends Record<string, unknown>>(
    id: RecordId<'string'>,
    payload?: T,
  ): Promise<T> {
    console.log('📤 postUpdate(): Updating record', id, payload)

    const result = await super.update<T>(
      id,
      payload,
    )
    console.log('update result:', result)
    // SurrealDB gibt ein Array zurück, daher das erste Element nehmen
    return result
  }
}
