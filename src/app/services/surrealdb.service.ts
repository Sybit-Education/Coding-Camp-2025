import { Injectable } from '@angular/core'
import Surreal, { RecordId, StringRecordId, Token } from 'surrealdb'
import { environment } from '../../environments/environment'
import { Event as AppEvent } from '../models/event.interface'

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
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Verbindung:', error)
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

  async getByRecordId<T extends Record<string, unknown>>(recordId: RecordId<string> | StringRecordId): Promise<T> {
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
  async post<T extends Record<string, unknown>>(table: string, payload?: T | T[]): Promise<T[]> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    return await super.insert<T>(table, payload)
  }

  async postUpdate<T extends Record<string, unknown>>(id: RecordId<string> | StringRecordId, payload?: T): Promise<T> {
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

  async fulltextSearchEvents(query: string): Promise<AppEvent[]> {
    console.debug('[SurrealdbService] fulltextSearchEvents called', { query })
    await this.initialize()

    const q = (query ?? '').trim()
    if (!q) {
      console.debug('[SurrealdbService] FTS skipped: empty query')
      return []
    }

    // Gewichtete FTS-Abfrage mit Highlight-Feldern (name/description/organizer/location/city)
    const ftsSql = `SELECT 
        *,
        search::highlight('<span class="highlight">', '</span>', 0) AS name_hl,
        search::highlight('<span class="highlight">', '</span>', 1) AS description_hl,
        search::highlight('<span class="highlight">', '</span>', 2) AS organizer_hl,
        search::highlight('<span class="highlight">', '</span>', 3) AS location_name_hl,
        search::highlight('<span class="highlight">', '</span>', 4) AS city_hl,
        (search::score(0)*3
         + search::score(1)*2
         + search::score(2)*2
         + search::score(3)*2
         + search::score(4)
        ) AS relevance
      FROM event
      WHERE
         name @0@ $q
         OR description @1@ $q
         OR organizer.name @2@ $q
         OR location.name @3@ $q
         OR location.city @4@ $q
      ORDER BY relevance DESC
      LIMIT 20;`

    const t0 = performance.now()
    console.debug('[SurrealdbService] Running FTS', { q, ftsSql })

    try {
      const res = await super.query(ftsSql, { q })
      const rows: AppEvent[] = Array.isArray(res) && res[0]?.result ? (res[0].result as AppEvent[]) : []

      console.debug('[SurrealdbService] FTS result count', { count: rows.length, ms: Math.round(performance.now() - t0) })

      if (rows.length > 0) {
        // Logge ein paar Titel zur Verifikation
        console.debug(
          '[SurrealdbService] FTS sample',
          rows.slice(0, 3).map((e: any) => e?.name ?? e?.id),
        )
        return rows
      }
    } catch (err) {
      console.warn('[SurrealdbService] FTS query failed, will fallback', err)
    }
    return []
  }
}
