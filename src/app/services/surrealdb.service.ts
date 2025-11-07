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
    await this.initialize()

    const q = (query ?? '').trim()
    if (!q) {
      console.debug('[SurrealdbService] FTS skipped: empty query')
      return []
    }

    // Vereinfachte FTS-Abfrage über Event-, Organizer- und Location-Felder
    const ftsSql = `SELECT * FROM event
WHERE name @@ $q
   OR description @@ $q
   OR organizer IN (SELECT id FROM organizer WHERE name @@ $q)
   OR location IN (SELECT id FROM location WHERE name @@ $q OR street @@ $q OR city @@ $q);`

    const t0 = performance.now()
    console.debug('[SurrealdbService] Running FTS', { q, ftsSql })

    try {
      const results = await super.query(ftsSql, { q })
      console.debug('[SurrealdbService] FTS raw', results)
      const last = results[results.length - 1] as { result?: unknown[] } | undefined
      const ftsEvents = (last?.result ?? []) as AppEvent[]
      console.debug('[SurrealdbService] FTS result count', { count: ftsEvents.length, ms: Math.round(performance.now() - t0) })
      if (ftsEvents.length > 0) {
        return ftsEvents
      }
    } catch (err) {
      console.warn('[SurrealdbService] FTS query failed, will fallback', err)
    }

    // Fallback: Substring-Suche ohne FTS-Indizes
    const fallbackSql = `LET $q = string::lowercase($q ?? '');
LET $orgs = SELECT id FROM organizer WHERE string::contains(string::lowercase(name ?? ''), $q);
LET $locs = SELECT id FROM location WHERE
  string::contains(string::lowercase(name ?? ''), $q) OR
  string::contains(string::lowercase(street ?? ''), $q) OR
  string::contains(string::lowercase(city ?? ''), $q);
SELECT * FROM event
WHERE string::contains(string::lowercase(name ?? ''), $q)
   OR string::contains(string::lowercase(description ?? ''), $q)
   OR organizer IN $orgs
   OR location IN $locs;`

    const t1 = performance.now()
    console.debug('[SurrealdbService] Running fallback substring search', { q, fallbackSql })
    const resultsFallback = await super.query(fallbackSql, { q })
    console.debug('[SurrealdbService] Fallback raw', resultsFallback)
    const lastFallback = resultsFallback[resultsFallback.length - 1] as { result?: unknown[] } | undefined
    const events = (lastFallback?.result ?? []) as AppEvent[]
    console.debug('[SurrealdbService] Fallback result count', { count: events.length, ms: Math.round(performance.now() - t1) })
    return events
  }
}
