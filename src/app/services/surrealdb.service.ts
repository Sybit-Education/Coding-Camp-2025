import { Injectable, inject } from '@angular/core'
import Surreal, { RecordId, StringRecordId, Token } from 'surrealdb'
import { environment } from '../../environments/environment'
import { Event as AppEvent } from '../models/event.interface'
import { DataCacheService } from './data-cache.service'

@Injectable({
  providedIn: 'root',
})
export class SurrealdbService extends Surreal {
  private connectionInitialized = false
  private connectionPromise: Promise<void> | null = null

  // Lightweight in-memory cache to reduce duplicate DB requests
  private readonly cache = inject(DataCacheService)
  private readonly defaultTtlMs = 60_000 // 60s default cache for read operations
  private readonly searchTtlMs = 10_000 // short cache for search results

  constructor() {
    super()
  }



  private tableFromRecordId(recordId: RecordId<string> | StringRecordId): string | undefined {
      return (recordId as any).tb ?? undefined
  }

  private tableKey(table: string): string {
    return `table:${table}`
  }

  private recordKey(recordId: RecordId<string> | StringRecordId): string {
    return `record:${recordId}`
  }

  private stableStringify(obj: unknown): string {
    if (obj == null || typeof obj !== 'object') return JSON.stringify(obj)
    const keys = new Set<string>()
    JSON.stringify(obj as any, (k, v) => {
      keys.add(k)
      return v
    })
    const sorted = Array.from(keys).sort()
    return JSON.stringify(obj as any, sorted)
  }

  private queryKey(sql: string, params?: unknown): string {
    const p = params === undefined ? '' : `:${this.stableStringify(params)}`
    return `query:${sql}${p}`
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
    const key = this.recordKey(recordId)
    return await this.cache.getOrFetch<T>(
      key,
      async () => {
        const result = await super.select<T>(recordId)
        return result as T
      },
      this.defaultTtlMs,
    )
  }

  // 2) Alle Einträge einer Tabelle holen
  async getAll<T extends Record<string, unknown>>(table: string): Promise<T[]> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    const key = this.tableKey(table)
    return await this.cache.getOrFetch<T[]>(
      key,
      async () => {
        return await super.select<T>(table)
      },
      this.defaultTtlMs,
    )
  }

  // 3) Einfügen und die neuen Datensätze zurückbekommen
  async post<T extends Record<string, unknown>>(table: string, payload?: T | T[]): Promise<T[]> {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    const res = await super.insert<T>(table, payload)
    // Invalidate caches related to this table and generic queries
    this.cache.invalidate(this.tableKey(table))
    this.cache.invalidatePrefix('query:')
    return res
  }

  async postUpdate<T extends Record<string, unknown>>(id: RecordId<string> | StringRecordId, payload?: T): Promise<T> {
    try {
      // Stelle sicher, dass die Verbindung initialisiert ist
      await this.initialize()
      const updatedRecord = await super.update<T>(id, payload)

      // Invalidate caches for this record and its table
      const table = this.tableFromRecordId(id)
      this.cache.invalidate(this.recordKey(id))
      if (table) this.cache.invalidate(this.tableKey(table))
      this.cache.invalidatePrefix('query:')

      return updatedRecord
    } catch (error) {
      console.error('Error in postUpdate:', error)
      throw error
    }
  }

  async deleteRow(recordId: RecordId<string> | StringRecordId) {
    // Stelle sicher, dass die Verbindung initialisiert ist
    await this.initialize()
    await super.delete(recordId)

    // Invalidate caches for this record and its table
    const table = this.tableFromRecordId(recordId)
    this.cache.invalidate(this.recordKey(recordId))
    if (table) this.cache.invalidate(this.tableKey(table))
    this.cache.invalidatePrefix('query:')
  }

  async fulltextSearchEvents(searchTerm: string): Promise<AppEvent[]> {
    await this.initialize()

    const q = (searchTerm ?? '').trim()
    if (!q) {
      console.debug('[SurrealdbService] FTS skipped: empty searchTerm')
      return []
    }

    // Gewichtete FTS-Abfrage (name/description/organizer/location/city...)
    const ftsSql = `SELECT 
        *,
        (search::score(0)*3     -- name
          + search::score(1)*2  -- description
          + search::score(2)    -- restriction
          + search::score(3)*2  -- organizer
          + search::score(4)*2  -- location name
          + search::score(5)    -- city
          + search::score(6)    -- event type
          + search::score(7)    -- topic
        ) AS relevance
      FROM event
      WHERE
        name @0@ $q
        OR description @1@ $q
        OR restriction @2@ $q
        OR organizer.name @3@ $q
        OR location.name @4@ $q
        OR location.city @5@ $q
        OR event_type.name @6@ $q
        OR topic.name @7@ $q
      ORDER BY relevance DESC
      LIMIT 30;`

    const key = this.queryKey(ftsSql, { q })

    try {
      const result = await this.cache.getOrFetch<AppEvent[]>(
        key,
        async () => {
          const res = (await super.query(ftsSql, { 'q': q }))[0] as AppEvent[]
          return Array.isArray(res) ? res : []
        },
        this.searchTtlMs,
        this.searchTtlMs, // allow brief SWR window to throttle rapid typing
      )
      return result
    } catch (err) {
      console.warn('[SurrealdbService] FTS query failed, will fallback', err)
      return []
    }
  }
}
