import { Injectable } from '@angular/core'
import Surreal, { RecordId, StringRecordId, Token } from 'surrealdb'
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root',
})
export class SurrealdbService extends Surreal {
  private connectionInitialized = false
  private connectionPromise: Promise<void> | null = null

  constructor() {
    super()
  }

  async initialize() {
    // Wenn bereits eine Initialisierung läuft, warte auf deren Abschluss
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    // Wenn die Verbindung bereits initialisiert ist, nichts tun
    if (this.connectionInitialized) {
      return
    }

    // Initialisiere die Verbindung und speichere das Promise
    this.connectionPromise = this.initializeConnection()
    return this.connectionPromise
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.connect(environment.surrealDbAddress, {
        namespace: environment.surrealDbNamespace,
        database: environment.surrealDbDatabase,
      })
      await this.ready
      this.connectionInitialized = true
      console.log(
        `SurrealDB-Verbindung [${environment.surrealDbDatabase}] initialisiert`,
      )
    } catch (error) {
      console.error(
        'Fehler bei der Initialisierung der SurrealDB-Verbindung:',
        error,
      )
      this.connectionPromise = null
      throw error
    }
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
    // Ensure connection is initialized before authentication
    await this.initialize()
    return await super.authenticate(token)
  }

  async getByRecordId<T extends Record<string, unknown>>(
    recordId: RecordId<string> | StringRecordId,
  ): Promise<T> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    const result = await super.select<T>(recordId)
    return result as T
  }

  // 2) Alle Einträge einer Tabelle holen
  async getAll<T extends Record<string, unknown>>(table: string): Promise<T[]> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    return await super.select<T>(table)
  }

  // 3) Einfügen und die neuen Datensätze zurückbekommen
  async post<T extends Record<string, unknown>>(
    table: string,
    payload?: T | T[],
  ): Promise<T[]> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    return await super.insert<T>(table, payload)
  }

  async postUpdate<T extends Record<string, unknown>>(
    id: RecordId<string> | StringRecordId,
    payload?: T,
  ): Promise<T> {
    try {
      // Stelle sicher, dass die Verbindung initialisiert ist
      await this.initialize()
      const updatedRecord = await super.update<T>(id, payload)

      return updatedRecord
    } catch (error) {
      console.error('Error in postUpdate:', error)
      throw error
    }
  }

  async deleteRow(recordId: RecordId<string> | StringRecordId) {
    await super.delete(recordId)
  }
}
