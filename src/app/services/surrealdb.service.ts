import { Injectable } from '@angular/core'
import Surreal, { StringRecordId, Token } from 'surrealdb'
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
  async getById<T extends Record<string, unknown>>(
    recordId: string,
  ): Promise<T> {
    console.log('📥 getById(): Fetching record with ID', recordId)
    const result = await super.select<T>(new StringRecordId(recordId))
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
  id: string,
  payload?: T,
): Promise<T> {

  console.log('📤 postUpdate(): Updating record', id, payload)


const result = await this.update<T>(new StringRecordId('event:' + id), payload)
console.log('update result:', result)
  // SurrealDB gibt ein Array zurück, daher das erste Element nehmen
return Array.isArray(result) ? result[0] : result}
}
