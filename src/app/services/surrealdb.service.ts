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
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()

    // 1) Versuch: Echte Volltextsuche mit @@ (setzt vorhandene SEARCH-Indizes voraus)
    const ftsSql = `
LET $q = $q;
SELECT * FROM event
WHERE name @@ $q
   OR description @@ $q
   OR organizer IN (SELECT id FROM organizer WHERE name @@ $q)
   OR location IN (SELECT id FROM location WHERE name @@ $q OR street @@ $q OR city @@ $q);
`
    try {
      const results = await super.query(ftsSql, { q: query })
      const last = results[results.length - 1] as { result?: unknown[] } | undefined
      const ftsEvents = (last?.result ?? []) as AppEvent[]
      if (ftsEvents.length > 0) {
        return ftsEvents
      }

      // 2) Fallback: Substring-Suche, wenn FTS keine Ergebnisse liefert
      const fallbackSql = `
LET $q = string::lowercase($q ?? '');
LET $orgs = SELECT id FROM organizer WHERE string::contains(string::lowercase(name ?? ''), $q);
LET $locs = SELECT id FROM location WHERE
  string::contains(string::lowercase(name ?? ''), $q) OR
  string::contains(string::lowercase(street ?? ''), $q) OR
  string::contains(string::lowercase(city ?? ''), $q);
SELECT * FROM event
WHERE string::contains(string::lowercase(name ?? ''), $q)
   OR string::contains(string::lowercase(description ?? ''), $q)
   OR organizer IN $orgs
   OR location IN $locs;
`
      const resultsFallback = await super.query(fallbackSql, { q: query })
      const lastFallback = resultsFallback[resultsFallback.length - 1] as { result?: unknown[] } | undefined
      return (lastFallback?.result ?? []) as AppEvent[]
    } catch (err) {
      // 3) Fallback bei Fehlern in der FTS-Ausführung
      console.warn('FTS-Suche fehlgeschlagen – weiche auf Substring-Suche aus.', err)
      const fallbackSql = `
LET $q = string::lowercase($q ?? '');
LET $orgs = SELECT id FROM organizer WHERE string::contains(string::lowercase(name ?? ''), $q);
LET $locs = SELECT id FROM location WHERE
  string::contains(string::lowercase(name ?? ''), $q) OR
  string::contains(string::lowercase(street ?? ''), $q) OR
  string::contains(string::lowercase(city ?? ''), $q);
SELECT * FROM event
WHERE string::contains(string::lowercase(name ?? ''), $q)
   OR string::contains(string::lowercase(description ?? ''), $q)
   OR organizer IN $orgs
   OR location IN $locs;
`
      const results = await super.query(fallbackSql, { q: query })
      const last = results[results.length - 1] as { result?: unknown[] } | undefined
      return (last?.result ?? []) as AppEvent[]
    }
  }
}
